import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { messagesTable } from "../db/schema.js";

export const getMessages = async (userId: string, limit = 20) => {
  const rows = await db.query.messagesTable.findMany({
    where: eq(messagesTable.userId, userId),
    orderBy: [desc(messagesTable.createdAt)],
    limit,
  });

  return rows.reverse().map((m) => ({ role: m.role, content: m.content }));
};
