import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { messagesTable } from "../db/schema.js";

export const getMessages = async (userId: string) => {
  const messages = await db.query.messagesTable.findMany({
    where: eq(messagesTable.userId, userId),
    orderBy: [desc(messagesTable.createdAt)],
    limit: 5,
  });
  return messages.map((messagge) => ({
    role: messagge.role,
    content: messagge.content,
  }));
};
