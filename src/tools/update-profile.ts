import { eq } from "drizzle-orm";
import { userInterestsTable, usersTable } from "../db/schema.js";
import { db } from "../db/db.js";

export const updateUserInterests = async (
  userId: string,
  interest: string,
  notes: string,
  priority: number
) => {
  await db
    .insert(userInterestsTable)
    .values({
      userId: userId,
      interest: interest,
      notes: notes,
      priority: priority,
    })
    .onConflictDoUpdate({
      target: [userInterestsTable.userId, userInterestsTable.interest],
      set: { notes, priority },
    });
};

export const updateUserName = async (userId: string, user_name: string) => {
  await db
    .update(usersTable)
    .set({
      name: user_name,
    })
    .where(eq(usersTable.id, userId));
};
