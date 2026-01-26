import { Router } from "express";
import { db } from "../../db/db.js";
import { eq } from "drizzle-orm";
import { AuthedRequest } from "../../middleware/requireUser.js";
import { usersTable } from "../../db/schema.js";

const router = Router();

router.get('/', async (req, res) => {
  const profile = await db.select({ phone_number: usersTable.phoneNumber, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, (req as AuthedRequest).userId))
  return res.json({
    phone_number: profile?.[0]?.phone_number,
    name: profile?.[0]?.name,
  })
})

export default router;