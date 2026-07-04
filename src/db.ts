import { createDbClient, type DbClient } from "@shared/db";
import { env } from "./env.ts";

export const db: DbClient = createDbClient({
  databaseUrl: env.DATABASE_URL,
});

export async function closeDb(): Promise<void> {
  await db.end();
}
