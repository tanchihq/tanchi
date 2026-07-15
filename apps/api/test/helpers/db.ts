import { db } from "../../src/db.ts";

const databaseUrl = process.env.DATABASE_URL;
if (
  databaseUrl === undefined ||
  !new URL(databaseUrl).pathname.slice(1).includes("test")
) {
  throw new Error(
    '[test] refusing to run: DATABASE_URL must point at a database whose name contains "test"'
  );
}

export { db };

export async function truncateAll(): Promise<void> {
  const rows = await db<ReadonlyArray<Readonly<{ tablename: string }>>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_migrations'
  `;
  if (rows.length === 0) return;
  const list = rows.map((row) => `"${row.tablename}"`).join(", ");
  await db.unsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
