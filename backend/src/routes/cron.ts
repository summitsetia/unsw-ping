import { Router } from "express";
import { db } from "../db/db.js";
import { eventsTable, userSocietiesTable, usersTable } from "../db/schema.js";
import { DateTime } from "luxon";
import { eq } from "drizzle-orm";
import axios from "axios";

const router = Router();

router.get("/api/cron/process-reminders", async () => {
  const events = await db.select().from(eventsTable);
  for (const event of events) {
    const nowUtc = DateTime.now().setZone("utc");
    const eventUtc = DateTime.fromJSDate(event.startTime, { zone: "utc" });
    const reminderTime = eventUtc.minus({ days: 0.5 });

    if (event.reminderSentAt) continue;

    const shouldSend =
      nowUtc >= reminderTime &&
      nowUtc < reminderTime.plus({ years: 0.0000019013 });

    await db
      .update(eventsTable)
      .set({ reminderSentAt: new Date() })
      .where(eq(eventsTable.id, event.id));

    if (shouldSend) {
      const rows = await db
        .select({
          userId: usersTable.id,
          phoneNumber: usersTable.phoneNumber,
          name: usersTable.name,
          societyName: userSocietiesTable.society_name,
        })
        .from(userSocietiesTable)
        .innerJoin(usersTable, eq(usersTable.id, userSocietiesTable.userId))
        .where(eq(userSocietiesTable.society_name, event.societyName));

      for (const row of rows) {
        const text = `Hey ${row.name}, just a quick reminder that ${event.title} is happening in 12 hours at ${event.location}.`;
        await axios.post(
          "https://api.sendblue.co/api/send-message",
          {
            content: text,
            from_number: "+1 (402)-613-7710",
            number: row.phoneNumber,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "sb-api-key-id": process.env.SENDBLUE_API_API_KEY!,
              "sb-api-secret-key": process.env.SENDBLUE_API_API_SECRET!,
            },
          }
        );
      }
    }
  }
});

export default router;
