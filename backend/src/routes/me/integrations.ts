import { Router } from "express";
import { db } from "../../db/db.js";
import { eq } from "drizzle-orm";
import { googleCalendarTokensTable } from "../../db/schema.js";
import { AuthedRequest } from "../../middleware/requireUser.js";

const router = Router();

router.get('/', async (req, res) => {
  const googleCalendarIntegration = await db.select({ refreshToken: googleCalendarTokensTable.refreshToken }).from(googleCalendarTokensTable).where(eq(googleCalendarTokensTable.userId, (req as AuthedRequest).userId))
  return res.json(googleCalendarIntegration[0]?.refreshToken ? { connected: true } : { connected: false })
})

export default router;