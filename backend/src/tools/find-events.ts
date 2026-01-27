import { inArray, sql } from "drizzle-orm";
import { db } from "../db/db.js";
import { eventsTable } from "../db/schema.js";
import { DateTime } from "luxon";

export const findEvents = async (societies: string[]) => {
  const societiesLower = societies
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!societiesLower.length) return [];

  const events = await db
    .select({
      societyName: eventsTable.societyName,
      title: eventsTable.title,
      startTime: eventsTable.startTime,
      endTime: eventsTable.endTime,
      location: eventsTable.location,
    })
    .from(eventsTable)
    .where(
      inArray(sql<string>`lower(${eventsTable.societyName})`, societiesLower)
    );

  const nowSyd = DateTime.now().setZone("Australia/Sydney");

  return events
    .map((e) => {
      const startSydney = DateTime.fromJSDate(e.startTime).setZone(
        "Australia/Sydney"
      );
      const endSydney = e.endTime ? DateTime.fromJSDate(e.endTime).setZone(
        "Australia/Sydney"
      ) : null;
      if (startSydney <= nowSyd) return null;

      return { ...e, startTime: startSydney.toJSDate(), endTime: endSydney ? endSydney.toJSDate() : undefined };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
};
