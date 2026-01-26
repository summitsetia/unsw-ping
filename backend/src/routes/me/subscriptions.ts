import { Router } from "express";
import { db } from "../../db/db.js";
import { and, eq } from "drizzle-orm";
import { userSocietiesTable } from "../../db/schema.js";
import { AuthedRequest } from "../../middleware/requireUser.js";

const router = Router();

router.get('/', async (req, res) => {
  const subscriptions = await db.select().from(userSocietiesTable).where(eq(userSocietiesTable.userId, (req as AuthedRequest).userId))
  return res.json(subscriptions)
});

router.delete('/', async (req, res) => {
  const deleted = await db.delete(userSocietiesTable).where(and(eq(userSocietiesTable.userId, (req as AuthedRequest).userId), eq(userSocietiesTable.society_name, req.body.societyName))).returning()
  return res.json({ societyName: deleted[0]?.society_name })
});

router.post('/', async (req, res) => {
  console.log(req.body)
  console.log((req as AuthedRequest).userId)
  console.log(req.body.societyNames.map((societyName: string) => ({
    user_id: (req as AuthedRequest).userId,
    society_name: societyName,
  })))
  const inserted = await db.insert(userSocietiesTable).values(req.body.societyNames.map((societyName: string) => ({
    userId: (req as AuthedRequest).userId,
    society_name: societyName,
  }))).returning()
  return res.json({ societyNames: inserted.map((row) => row.society_name) })
});

export default router;