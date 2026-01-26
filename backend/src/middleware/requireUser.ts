import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../utils/supabase.js";
import { usersTable } from "../db/schema.js";
import { db } from "../db/db.js";
import { eq } from "drizzle-orm";

export type AuthedRequest = Request & {
  userId: string;
};

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";

  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });

  const userIdQuery = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.supabaseAuthUserId, data.user.id));

  (req as AuthedRequest).userId = userIdQuery[0]?.id;
  next();
}
