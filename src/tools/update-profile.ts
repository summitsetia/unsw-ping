import { eq } from "drizzle-orm";
import { userInterestsTable, usersTable } from "../db/schema.js";
import { db } from "../db/db.js";

const updateProfile = async (
  userId: string,
  name: string,
  interests: string,
  notes: string,
  priority: number
) => {
  await db
    .update(usersTable)
    .set({
      name: name,
    })
    .where(eq(usersTable.id, userId));

  await db.insert(userInterestsTable).values({
    userId: userId,
    interest: interests,
    notes,
    priority,
  });
};

export default updateProfile;
