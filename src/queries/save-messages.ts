import { db } from "../db/db.js";
import { messagesTable } from "../db/schema.js";

export const saveIncomingMessage = async (userId: string, content: string) => {
  await db.insert(messagesTable).values({
    userId,
    content,
    role: "user",
  });
};

export const saveOutgoingMessage = async (userId: string, content: string) => {
  await db.insert(messagesTable).values({
    userId,
    content,
    role: "assistant",
  });
};
