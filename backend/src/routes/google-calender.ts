import { Router } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import { db } from "../db/db.js";
import {
  calendarConnectRequestsTable,
  googleCalendarTokensTable,
  usersTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { googleLink } from "../tools/google-link.js";
import { supabaseAdmin } from "../utils/supabase.js";

dotenv.config();

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

router.get("/google/link", async (req, res) => {
  const auth = req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";

  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });
  const authUserId = data.user.id;
  const userIdQuery = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.supabaseAuthUserId, authUserId));
  const userId = userIdQuery[0]?.id;

  try {
    const url = await googleLink(userId);
    return res.json({ url });
  } catch (err) {
    console.error("Error generating google link:", err);
    return res.status(500).json({ error: "Failed to generate link" });
  }
});

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
  if (!connectRequest?.userId) {
    return res.status(400).json({ error: "Invalid connect request" });
  }

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

  await db
    .insert(googleCalendarTokensTable)
    .values({
      userId: connectRequest.userId,
      refreshToken: tokens.refresh_token,
      expiresAt: refreshTokenExpiresAt,
    })
    .onConflictDoUpdate({
      target: googleCalendarTokensTable.userId,
      set: {
        refreshToken: tokens.refresh_token,
        expiresAt: refreshTokenExpiresAt,
        updatedAt: new Date(),
      },
    });

  const frontendUrlRaw =
    process.env.FRONTEND_APP_URL ||
    process.env.FRONTEND_BASE_URL ||
    "http://localhost:5173";

  const frontendUrl = frontendUrlRaw.startsWith("http://") ||
    frontendUrlRaw.startsWith("https://")
    ? frontendUrlRaw
    : `http://${frontendUrlRaw}`;

  return res.redirect(`${frontendUrl}/dashboard/integrations`);
  // return res.type("html").send(`...connected...`);
});

export default router;
