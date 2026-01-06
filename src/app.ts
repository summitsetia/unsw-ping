import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";
import { z } from "zod";
import { generateText, stepCountIs, tool } from "ai";
import type { ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "./db/db.js";
import { usersTable } from "./db/schema.js";
import { userInterestsTable } from "./db/schema.js";
import { messagesTable } from "./db/schema.js";
import { userInterestsRelations } from "./db/schema.js";
import { messagesRelations } from "./db/schema.js";
import { usersRelations } from "./db/schema.js";
import { getMessages } from "./queries/get-messages.js";
import { getUserProfile } from "./queries/get-user-profile.js";
import updateProfile from "./tools/update-profile.js";
import {
  saveIncomingMessage,
  saveOutgoingMessage,
} from "./queries/save-messages.js";
import { findSocieties } from "./tools/find-societies.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/webhooks/sendblue", async (req, res) => {
  try {
    console.log("Received webhook from Sendblue");
    const { content, from_number, message_handle, is_outbound, status } =
      req.body;
    if (is_outbound) return res.sendStatus(200);
    if (!content?.trim()) return res.sendStatus(200);
    console.log("Request body:", req.body);

    const user = await db
      .insert(usersTable)
      .values({
        phoneNumber: from_number,
      })
      .onConflictDoUpdate({
        target: usersTable.phoneNumber,
        set: { phoneNumber: from_number },
      })
      .returning();
    console.log("User inserted:", user);
    const userId = user[0].id;
    await saveIncomingMessage(userId, content);
    const userProfile = await getUserProfile(userId);
    const messages = await getMessages(userId);

    const modelMessages = messages.map(
      (message): ModelMessage => ({
        role: message.role,
        content: message.content,
      })
    );

    const { text } = await generateText({
      model: openai("gpt-5.2"),
      system: `You are Ping — a chill, friendly UNSW student who helps people find societies + events they’d actually enjoy.

      Mission:
      - Over time, learn what the user likes (interests, causes, degree vibe, schedule).
      - Recommend relevant UNSW societies + upcoming events.
      - Help them subscribe to updates, and only notify when it’s genuinely relevant.
      
      Hard rules:
      - Treat database/tool outputs as ground truth for societies/events. Do NOT invent society names, event times, or links.
      - Always show event dates/times in Australia/Sydney and include the event link if available.
      - Respect preferences (budget, location, time, event type). If there’s a conflict, explain briefly and offer alternatives.
      - When the user shares stable info about themselves (interests/preferences/constraints), call updateProfile with a minimal patch.
      - Do not store sensitive info unless needed.
      
      Style (VERY IMPORTANT):
      - Text like a real person. Short messages. Natural. No “survey” vibe.
      - Don’t front-load questions. Be gradual.
      - Ask at most ONE question per message.
      - Avoid menus like “Pick a few:” unless the user says “idk” or gives very little info.
      - Don’t use bullet lists unless you’re recommending actual societies/events.
      - If you need more info, ask a casual follow-up that flows from what they just said.
      
      Conversation pacing:
      - If you don’t know their interests yet: start with a friendly opener + one light question (“what’ve you been into lately?”).
      - Only ask about schedule after you’ve got at least one interest or you’re about to suggest an event.
      - If user gives a broad interest (“tech”), ask one narrowing question next (AI vs startups vs coding clubs, beginner vs advanced, social vs workshops).
      
      Here is the user's profile snapshot:
      ${JSON.stringify(userProfile)}`,
      messages: modelMessages,
      tools: {
        updateProfile: tool({
          description:
            "Update the user's profile with name + interests (with notes + priority).",
          inputSchema: z.object({
            name: z.string(),
            interests: z.string().describe("The user's interests"),
            notes: z.string().describe("The user's notes"),
            priority: z.number().describe("Priority of the interest"),
          }),
          execute: async ({ name, interests, notes, priority }) => {
            await updateProfile(userId, name, interests, notes, priority);
            return { ok: true };
          },
        }),
        findSocieties: tool({
          description: "Find societies that match the user's interests",
          inputSchema: z.object({
            interests: z.string().describe("The user's interests"),
          }),
          execute: async ({ interests }) => {
            return await findSocieties(interests.split(","));
          },
        }),
      },
      stopWhen: stepCountIs(6),
    });

    const message = await axios.post(
      "https://api.sendblue.co/api/send-message",
      {
        content: text,
        from_number: "+1 (402)-613-7710",
        number: from_number,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "sb-api-key-id": process.env.SENDBLUE_API_API_KEY!,
          "sb-api-secret-key": process.env.SENDBLUE_API_API_SECRET!,
        },
      }
    );

    console.log("Message sent successfully:", message.data);
    await saveOutgoingMessage(userId, text);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error sending message:", error);
    res.sendStatus(200);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
