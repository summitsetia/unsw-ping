import { eq, inArray } from "drizzle-orm";
import { db } from "../db/db.js";
import { eventsTable } from "../db/schema.js";
import { DateTime } from "luxon";

export const findEvents = async (societies: string[]) => {
  if (!societies.length) return [];

  // (also faster: 1 query instead of looping)
  const events = await db
    .select({
      societyName: eventsTable.societyName,
      title: eventsTable.title,
      startTime: eventsTable.startTime, // JS Date (UTC instant)
      location: eventsTable.location,
    })
    .from(eventsTable)
    .where(inArray(eventsTable.societyName, societies));

  return events.map((e) => {
    const startSydney = DateTime.fromJSDate(e.startTime, {
      zone: "utc",
    }).setZone("Australia/Sydney");

    return {
      ...e,
      startTime: startSydney.toJSDate(),
    };
  });
};
