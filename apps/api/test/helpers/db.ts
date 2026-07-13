import { db } from "../../src/db.ts";

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
