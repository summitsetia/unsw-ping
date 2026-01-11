import { db } from "../db/db.js";
import { calendarConnectRequestsTable } from "../db/schema.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

export const googleLink = async (userId: string) => {
  const reqId = crypto.randomUUID();
  await db.insert(calendarConnectRequestsTable).values({
    id: reqId,
    userId,
  });
  const url = `${process.env.PUBLIC_BASE_URL}/google/connect?req=${reqId}`;
  return url;
};
