import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { eventsTable } from "../db/schema.js";

export const findEvents = async (societies: string[]) => {
  if (!societies.length) return [];

  const eventResults: {
    societyName: string;
    title: string;
    startTime: Date;
  }[] = [];

  for (const society of societies) {
    const events = await db
      .select({
        societyName: eventsTable.societyName,
        title: eventsTable.title,
        startTime: eventsTable.startTime,
        location: eventsTable.location,
      })
      .from(eventsTable)
      .where(eq(eventsTable.societyName, society));
    console.log(events);
    eventResults.push(...events);
  }

  console.log(eventResults);

  return eventResults;
};
