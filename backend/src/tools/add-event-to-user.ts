import { db } from "../db/db.js";
import { google } from "googleapis";
import { googleCalendarTokensTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const addEventToUser = async (
  userId: string,
  summary: string,
  location?: string,
  start?: Date
) => {
  console.log("[addEventToUser] called", { userId, summary, location, start });

  if (!start) throw new Error("start is required");

  const row = await db.query.googleCalendarTokensTable.findFirst({
    where: eq(googleCalendarTokensTable.userId, userId),
  });
  console.log("[addEventToUser] token row for user:", row);
  if (!row) throw new Error("User has not connected Google Calendar");
  if (!row.refreshToken) throw new Error("Missing refresh token");

  oauth2Client.setCredentials({ refresh_token: row.refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  try {
    console.log("[addEventToUser] inserting event…");

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary,
        location,
        start: {
          dateTime: start.toISOString(),
          timeZone: "Australia/Sydney",
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: "Australia/Sydney",
        },
      },
    });

    console.log("[addEventToUser] event inserted", {
      id: res.data.id,
      htmlLink: res.data.htmlLink,
    });

    return res.data;
  } catch (err: any) {
    console.error("[addEventToUser] insert failed", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    throw err;
  }
};
