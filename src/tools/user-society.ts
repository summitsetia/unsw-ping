import { and, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { userSocietiesTable } from "../db/schema.js";

export const addUserSociety = async (userId: string, societyName: string) => {
  await db.insert(userSocietiesTable).values({
    userId,
    society_name: societyName,
  });
};

export const removeUserSociety = async (
  userId: string,
  societyName: string
) => {
  await db
    .delete(userSocietiesTable)
    .where(
      and(
        eq(userSocietiesTable.userId, userId),
        eq(userSocietiesTable.society_name, societyName)
      )
    );
};
