import { asc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { messagesTable } from "../db/schema.js";

export const getMessages = async (userId: string) => {
  const messages = await db.query.messagesTable.findMany({
    where: eq(messagesTable.userId, userId),
    orderBy: [asc(messagesTable.createdAt)],
    limit: 5,
  });
  return messages.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));
};
