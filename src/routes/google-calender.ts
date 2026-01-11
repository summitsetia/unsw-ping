import { Router } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import { db } from "../db/db.js";
import {
  calendarConnectRequestsTable,
  googleCalendarTokensTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";

dotenv.config();

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

router.get("/google/connect", async (req, res) => {
  const reqId = String(req.query.req || "");
  if (!reqId) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: reqId,
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  if (!code || !state) {
    return res.status(400).json({ error: "Code and state are required" });
  }

  const connectRequest = await db.query.calendarConnectRequestsTable.findFirst({
    where: eq(calendarConnectRequestsTable.id, state),
  });
  console.log(connectRequest);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  console.log("Tokens:", tokens);

  // @ts-ignore
  const refreshTokenExpiresAt =
    // @ts-ignore
    tokens.refresh_token_expires_in != null
      ? // @ts-ignore
        new Date(Date.now() + tokens.refresh_token_expires_in * 1000)
      : null;

  await db.insert(googleCalendarTokensTable).values({
    userId: connectRequest!.userId!,
    refreshToken: tokens.refresh_token,
    expiresAt: refreshTokenExpiresAt,
  });

  res.type("html").send(`...connected...`);
});

export default router;
