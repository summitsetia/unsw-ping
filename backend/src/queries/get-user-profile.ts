import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { userInterestsTable, usersTable } from "../db/schema.js";

export const getUserProfile = async (userId: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  const userInterests = await db.query.userInterestsTable.findFirst({
    where: eq(userInterestsTable.userId, userId),
  });
  return {
    ...user,
    interests: userInterests?.interest,
    notes: userInterests?.notes,
    priority: userInterests?.priority,
  };
};
