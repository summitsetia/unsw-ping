import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { usersTable } from "../db/schema.js";

export const getUserProfile = async (userId: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  return user;
};
