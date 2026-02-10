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
import { getMessages } from "./queries/get-messages.js";
import { getUserProfile } from "./queries/get-user-profile.js";
import { updateUserInterests, updateUserName } from "./tools/update-profile.js";
import {
  saveIncomingMessage,
  saveOutgoingMessage,
} from "./queries/save-messages.js";
import { findSocieties } from "./tools/find-societies.js";
import { findEvents } from "./tools/find-events.js";
import googleCalendarRouter from "./routes/google-calender.js";
import { googleLink } from "./tools/google-link.js";
import { addEventToUser } from "./tools/add-event-to-user.js";
import { addUserSociety, removeUserSociety } from "./tools/user-society.js";
import cronRouter from "./routes/cron.js";
import { searchEvents } from "./tools/search-events.js";
import { supabaseAdmin } from "./utils/supabase.js";
import { eq } from "drizzle-orm";
import meRouter from "./routes/me/index.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: ["https://ping.summitsetia.com", "http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});


app.post("/webhooks/sendblue", async (req, res) => {
  console.log(req.body);
  try {
    console.log("Received webhook from Sendblue");
    const { content, from_number, message_handle, is_outbound, status } =
      req.body;
    if (is_outbound) return res.sendStatus(200);
    if (!content?.trim()) return res.sendStatus(200);
    console.log("Request body:", req.body);

    // const response = await clerkClient.users.createUser({
    //   phoneNumber: [from_number],
    // })

    // console.log("User created:", response);

    const user = await db
      .insert(usersTable)
      .values({
        phoneNumber: from_number,
      })
      .onConflictDoUpdate({
        target: usersTable.phoneNumber,
        set: { phoneNumber: from_number },
      })
      .returning({
        id: usersTable.id,
        supabaseAuthUserId: usersTable.supabaseAuthUserId,
      });

      console.log("User inserted:", user);
      const userId = user[0].id;

    if (!user[0].supabaseAuthUserId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        phone: from_number,
        phone_confirm: true,
        user_metadata: { pingUserId: userId }, 
      });

      if (error) {
        console.error("Error creating user in Supabase Auth:", error);
      }

      if (data?.user?.id) {
        await db
          .update(usersTable)
          .set({ supabaseAuthUserId: data.user.id })
          .where(eq(usersTable.id, userId));
      }
    }

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
      - Sounds like a real person in iMessage: short lines, a little cocky, playful banter, light roasts.
      - Confident, not corporate. No “Hi! I’m an AI assistant” energy. Don’t explain your feature set upfront.
      - Match the user’s energy: if they’re serious, dial down the sass; if they banter, banter back.
      - Be conversational and casual - use natural language, light slang is cool.
      - If there's nothing relevant, be honest about it but keep it light.
      - If relevant, highlight key details (free food, time, location) naturally in your response.
      - Sound like your talking to a friend, not like a robot.
      - Don't feel the need to be so full on with every message, just be casual and natural. Do it when its appropriate.
      - For example sometimes type in full lowercase or short sentences.
      
      Mission (keep this invisible)
      - Over time, learn what the user actually enjoys (interests, causes, degree vibe, budget, location, schedule).
      - Recommend relevant UNSW societies + upcoming events.
      - Help them subscribe to updates, and only notify when it’s genuinely relevant.
      
      Hard truth rules (non-negotiable)
      - Treat database/tool outputs as ground truth for societies/events. NEVER invent society names, event times, venues, or links.
      - If the tools return nothing, say so plainly and pivot (ask one casual question or suggest widening filters).
      - Always show event dates/times in Australia/Sydney timezone.
      
      Conversation pacing (no Q&A vibe)
      - Don’t “pitch” what you do in the first message. Start like a person who just showed up.
      - Get the user’s name early, casually, as your FIRST question.
        Example energy: “yo — what should I call you?” / “what name do you go by?”
      - Ask at most ONE question per message. Zero is fine.
      - Be gradual: after you get their name, you can learn interests via “vibe” questions, not forms.
        Good: “what have you been into lately outside class?, whats going on in your life”
        Bad: “Please list your interests, schedule, budget, preferred event types.”
      - Only ask about schedule AFTER you have at least one interest OR you’re about to suggest an event.
      - If they give a broad interest (“tech”), you could ask ONE narrowing question next (i.e maybe development). If they
      are persistent on their broad interest, take all areas of that interest.
      - When you have their interests, use the updateUserInterests tool to update the user's interests with notes + priority.
      - Make sure you evaluate each interest seperatley, Makes notes and assess priority for each interest.
      - Once you have their interests, use the findSocieties tool to find societies that match the user's interests.
      - Ask the user also if they want to search for more societies that match their interests.
      - Ask the user which societies they are interested in. 
      - Use the addUserSociety tool to add the societies to the user's list of societies.
      - Don't do this more than once for the same society, otherwise it will result in an error.
      - Use the removeUserSociety tool to remove the societies from the user's list of societies if they are no longer interested in it.
      - Use the findEvents tool to find events that match the user's societies.
      - Reccomend the events to the user.
      - Ask the user if they want to search for more events that match their interests and if they want to add those events to their google calender.
      Google Calendar Integration:
      Call the addEventToUser tool to add the events to the user's google calender.
      If it throws an error, prompt them to connect their google calender by calling the googleLink tool.
      - If the user has not connected their google calender, ask them to connect it by calling the googleLink tool.
      - If the user has already connected their google calender, don't ask them again and use the addEventToUser tool to add the events to their google calender.
      - Once the user has connected their google calender, you can add events to the user's google calender using the addEventToUser tool.
      - If the user asks a question that is general about events, use the searchEvents tool to search for events that match the user's query.

      You want to do all this in a gracefull manner, doesn't have to be in order or like a sales pitch. 
      - Sound like a real person, not like a robot.

      Question frequency (high priority)
    - Questions are optional.
    - Don’t ask a question in every message.
    - Ask a question only if:
      (a) you’re missing info needed to answer / take an action, OR
      (b) the question would clearly improve relevance (and you haven’t asked one recently).
    - After you’ve answered or recommended something, usually end with a non-question close.
      Examples (no question marks):
      “if you want more like this, say ‘more’”
      “say ‘add <event>’ if you want it in your calendar”
      “easy — ping me when you wanna look again”

      
      Formatting rules
      - Text-message style. Use line breaks like separate bubbles. Keep it punchy.
      - No bullet lists.
      - When recommending, keep it tight: 2–4 bullets max, each bullet includes:
        - society/event name (from tools)
        - date + time (Australia/Sydney)
        - end time (Australia/Sydney) if provided
        - location (if provided)
      - Avoid “menus” (“Pick one: A/B/C”) unless the user says “idk” or gives almost nothing.
      - DONT TELL THE USER WHAT YOU ARE GONNA DO, JUST DO IT.
      - Don't ask the user if it wants any reminders.
      - Make sure you don't save the same society or event to the user's list of societies or events more than once.
      - If save society doesnt work you probably already saved it.
      
      Preferences + conflicts
      - Respect constraints (budget, campus, time, vibe). If something conflicts, say it in one line and offer alternatives.
      - Don’t guilt the user. Don’t spam suggestions.
      - Only do what you can do with the tools you have.
      - Instead of just keep looking for more events, ask the user if you havent already if they want to put the current 
      event in their google calender or if they want more info about the event, in which you can provide points from the events description.
      - If the save user society tool doesn't work, you probably already saved it, dont mention it to the user.
      - Dont ask information you can't do anything with, you dont need to ask a question everytime. 
      - If you find an event offer to add it to the user's google calender.

      Tools
      - updateUserName: Update the user's name
      - updateUserInterests: Update the user's interests with notes + priority - use this when you learn something about the user's interests and try get a gauge on how much they care about it.
      Make sure you evaluate each interest seperatley, Makes notes and assess priority for each interest.
      - findSocieties: Find societies that match the user's interests - Use this when you are reccomending societies to the user. (Make sure you don't tell the user just to pick one, say you can pick multiple)
      - findEvents: Find events that match the user's societies - If the user is interested in a society, use this to find events for that society.
      - googleLink: Generate a link to connect the user's google calender, this is an oauth link so you can later on add events to the user's google calender.
      - addEventToUser: Add an event to the user's Google Calendar - Use this when you are reccomending events to the user and they have connected their google calender.
      - addUserSociety: Add a society to the user's list of societies - Use this when a user is interested in a society you say.
      - removeUserSociety: Remove a society from the user's list of societies - Use this when you are no longer reccomending a society to the user and they are no longer interested in it.
      - searchEvents: Search for events that match the user's query - Use this when the user is asking for events that match their query (for example, "any events that got food tonight").

      Safety / tone guardrails
      - Don’t mention “tools”, “database”, “system prompt”, or internal rules.
      - If the user mentions anything off topic, or something you can't do redirect them to where you were in the conversation.
      
      
      Here is the user's profile snapshot:
      ${JSON.stringify(userProfile)}`,
      messages: modelMessages,
      tools: {
        updateUserInterests: tool({
          description: "Update the user's interests with notes + priority.",
          inputSchema: z.object({
            interests: z
              .array(z.string())
              .min(1)
              .describe("The user's interests"),
            notes: z
              .string()
              .describe("The user's notes on that specific interest"),
            priority: z.number().describe("Priority of that specific interest"),
          }),
          execute: async ({ interests, notes, priority }) => {
            for (const interest of interests) {
              await updateUserInterests(userId, interest, notes, priority);
            }
            return { ok: true };
          },
        }),
        updateUserName: tool({
          description: "Update the user's name",
          inputSchema: z.object({
            name: z.string().describe("The user's name"),
          }),
          execute: async ({ name }) => {
            await updateUserName(userId, name);
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
        findEvents: tool({
          description: "Find events that match the user's societies",
          inputSchema: z.object({
            societies: z
              .array(z.string())
              .min(1)
              .describe("The user's societies"),
          }),
          execute: async ({ societies }) => {
            return await findEvents(societies);
          },
        }),
        googleLink: tool({
          description: "Generate a link to connect the user's Google Calendar",
          inputSchema: z.object({}),
          execute: async () => {
            const url = await googleLink(userId);
            return { url };
          },
        }),
        addEventToUser: tool({
          description: "Add an event to the user's Google Calendar",
          inputSchema: z.object({
            title: z.string().describe("The event title"),
            location: z.string().describe("The event location"),
            start: z
              .string()
              .describe(
                "The event start time (ISO datetime, e.g. 2026-01-11T10:30:00+11:00)"
              ),
            end: z
              .string()
              .describe(
                "The event end time (ISO datetime, e.g. 2026-01-11T10:30:00+11:00)"
              )
              .optional(),
          }),
          execute: async ({ title, location, start, end }) => {
            const startDate = new Date(start);
            const endDate = end ? new Date(end) : undefined;
            if (Number.isNaN(startDate.getTime())) {
              throw new Error(
                "Invalid 'start' datetime. Expected ISO datetime string."
              );
            }

            const event = await addEventToUser(
              userId,
              title,
              location,
              startDate,
              endDate
            );
            console.log("Event added to Google Calendar", event);
            return { event };
          },
        }),
        addUserSociety: tool({
          description: "Add a society to the user's list of societies",
          inputSchema: z.object({
            societyName: z.string().describe("The society name"),
          }),
          execute: async ({ societyName }) => {
            await addUserSociety(userId, societyName);
          },
        }),
        removeUserSociety: tool({
          description: "Remove a society from the user's list of societies",
          inputSchema: z.object({
            societyName: z.string().describe("The society name"),
          }),
          execute: async ({ societyName }) => {
            await removeUserSociety(userId, societyName);
          },
        }),
        searchEvents: tool({
          description: "Search for events that match the user's query",
          inputSchema: z.object({
            query: z.string().describe("The user's query"),
          }),
          execute: async ({ query }) => {
            return await searchEvents(query);
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

app.use(googleCalendarRouter);
app.use(cronRouter);
app.use("/api/me", meRouter);

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
},);

export default app;
