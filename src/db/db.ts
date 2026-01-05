import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env (and load it) or export it in your shell."
  );
}

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema, logger: true });
