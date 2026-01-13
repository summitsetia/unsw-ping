import { inArray } from "drizzle-orm";
import { db } from "../db/db.js";
import { eventsTable } from "../db/schema.js";
import { DateTime } from "luxon";

export const findEvents = async (societies: string[]) => {
  if (!societies.length) return [];

  const events = await db
    .select({
      societyName: eventsTable.societyName,
      title: eventsTable.title,
      startTime: eventsTable.startTime,
      location: eventsTable.location,
    })
    .from(eventsTable)
    .where(inArray(eventsTable.societyName, societies));

  return events
    .map((e) => {
      const nowSyd = DateTime.now().setZone("Australia/Sydney");
      const startSydney = DateTime.fromJSDate(e.startTime, {
        zone: "utc",
      }).setZone("Australia/Sydney");
      const isInFuture = startSydney > nowSyd;
      if (!isInFuture) return null;

      return {
        ...e,
        startTime: startSydney.toJSDate(),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
};
