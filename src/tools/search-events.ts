import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "../db/db.js";
import { eventsTable } from "../db/schema.js";
import { and, asc, gt, isNotNull } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm";
import { DateTime } from "luxon";

export const searchEvents = async (query: string) => {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });
  console.log("embedding", embedding);

  const distance = cosineDistance(eventsTable.embedding, embedding);

  const rows = await db
    .select({
      title: eventsTable.title,
      description: eventsTable.description,
      location: eventsTable.location,
      startTime: eventsTable.startTime,
      distance,
    })
    .from(eventsTable)
    .where(
      and(
        isNotNull(eventsTable.embedding),
        gt(eventsTable.startTime, new Date())
      )
    )
    .orderBy(asc(distance))
    .limit(10);
  console.log("rows", rows);

  return rows.map((r) => ({
    ...r,
    startTimeSydney: DateTime.fromJSDate(r.startTime)
      .setZone("Australia/Sydney")
      .toISO(),
  }));
};
