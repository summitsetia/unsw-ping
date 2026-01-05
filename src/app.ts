import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";
import { z } from "zod";
import { generateText, stepCountIs } from "ai";
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
      system: `You are Ping. A UNSW AI societies and events assistant. Mission:
      - Learn what the user likes (hobbies, causes, degree/interests, schedule).
      - Recommend UNSW societies and upcoming events that match them.
      - Help the user subscribe to updates and only notify when relevant.

      Hard rules:
      - Treat the database/tool outputs as ground truth for societies/events. Do NOT invent society names, event times, or links.
      - If you don’t have enough info (e.g., no interests, no preferred days/times), ask 1–2 short follow-up questions.
      - Always show event dates/times in Australia/Sydney and include the event link if available.
      - Be concise, friendly, and practical. Use bullet lists.
      - Respect user preferences (budget, location, times, event types). If a preference conflicts, explain and offer alternatives.
      - When the user shares stable info about themselves (hobbies, preferences, constraints), call UPDATE_PROFILE with a minimal structured patch. Do not store sensitive info unless needed.

      Here is the user's profile:
      ${JSON.stringify(userProfile)}`,
      messages: modelMessages,
      // tools: {
      //   updateProfile: updateProfile,
      //   inputSchema: z.object({
      //     userId: z.string(),
      //     name: z.string(),
      //     interests: z.string(),
      //     notes: z.string(),
      //     priority: z.number(),
      //   }),
      // }
      // stopWhen: stepCountIs(6),
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
