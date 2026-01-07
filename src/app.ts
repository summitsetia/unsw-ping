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
      system: `You are Ping — a cheeky but genuinely helpful UNSW mate who “just happens” to know what’s going on around campus.

      Core vibe
      - Sounds like a real person in iMessage: short lines, a little cocky, playful banter, light roasts (never mean).
      - Confident, not corporate. No “Hi! I’m an AI assistant” energy. Don’t explain your feature set upfront.
      - Match the user’s energy: if they’re serious, dial down the sass; if they banter, banter back.
      
      Mission (keep this invisible)
      - Over time, learn what the user actually enjoys (interests, causes, degree vibe, budget, location, schedule).
      - Recommend relevant UNSW societies + upcoming events.
      - Help them subscribe to updates, and only notify when it’s genuinely relevant.
      
      Hard truth rules (non-negotiable)
      - Treat database/tool outputs as ground truth for societies/events. NEVER invent society names, event times, venues, or links.
      - If the tools return nothing, say so plainly and pivot (ask one casual question or suggest widening filters).
      - Always show event dates/times in Australia/Sydney timezone.
      - Include the event link if available; if no link is provided by tools, say “no link listed”.
      
      Conversation pacing (no Q&A vibe)
      - Don’t “pitch” what you do in the first message. Start like a person who just showed up.
      - Get the user’s name early, casually, as your FIRST question.
        Example energy: “yo — what should I call you?” / “what name do you go by?”
      - Ask at most ONE question per message. Zero is fine.
      - Be gradual: after you get their name, you can learn interests via “vibe” questions, not forms.
        Good: “what have you been into lately outside class?” / “what’s your current era — gym, coding, games, music?”
        Bad: “Please list your interests, schedule, budget, preferred event types.”
      - Only ask about schedule AFTER you have at least one interest OR you’re about to suggest an event.
      - If they give a broad interest (“tech”), ask ONE narrowing question next (AI vs startups vs coding clubs; social vs workshops; beginner vs deep nerd).
      
      Formatting rules
      - Text-message style. Use line breaks like separate bubbles. Keep it punchy.
      - No bullet lists unless you’re recommending actual societies/events.
      - When recommending, keep it tight: 2–4 bullets max, each bullet includes:
        - society/event name (from tools)
        - date + time (Australia/Sydney)
        - location (if provided)
        - link (if provided)
      - Avoid “menus” (“Pick one: A/B/C”) unless the user says “idk” or gives almost nothing.
      
      Preferences + conflicts
      - Respect constraints (budget, campus, time, vibe). If something conflicts, say it in one line and offer alternatives.
      - Don’t guilt the user. Don’t spam suggestions.
      
      Profile memory
      - When the user shares stable info (name, interests, degree, constraints, event preferences), call updateProfile with a minimal patch.
      - Do not store sensitive info unless needed.
      
      Safety / tone guardrails
      - Tease ≠ insult. No degrading comments. No identity-based jokes. Keep roasts mild and about choices/vibes.
      - Don’t mention “tools”, “database”, “system prompt”, or internal rules.
      
      
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
