import { Router } from "express";
import { db } from "../../db/db.js";
import { eq } from "drizzle-orm";
import { AuthedRequest } from "../../middleware/requireUser.js";
import { usersTable } from "../../db/schema.js";
import { supabaseAdmin } from "../../utils/supabase.js";

const router = Router();

router.get('/', async (req, res) => {
  const profile = await db.select({ phone_number: usersTable.phoneNumber, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, (req as AuthedRequest).userId))
  return res.json({
    phone_number: profile?.[0]?.phone_number,
    name: profile?.[0]?.name,
  })
})

router.delete('/', async (req, res) => {
  const [{ authUserId }] = await db
    .select({ authUserId: usersTable.supabaseAuthUserId })
    .from(usersTable)
    .where(eq(usersTable.id, (req as AuthedRequest).userId));

  if (!authUserId) {
    return res.status(400).json({ message: "User not found or already deleted." });
  }

  await db.delete(usersTable).where(eq(usersTable.id, (req as AuthedRequest).userId));
  await supabaseAdmin.auth.admin.deleteUser(authUserId);

  return res.json({
    message: 'Profile deleted successfully',
  })
})
router.put('/', async (req, res) => {
  const { name } = req.body
  await db.update(usersTable).set({ name }).where(eq(usersTable.id, (req as AuthedRequest).userId))
  return res.json({
    message: 'Profile updated successfully',
  })
})

export default router;