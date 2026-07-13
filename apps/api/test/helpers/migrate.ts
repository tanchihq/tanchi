import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const MIGRATIONS_DIR = join(import.meta.dir, "../../migrations");

export async function ensureTestDatabase(databaseUrl: string): Promise<void> {
  const target = new URL(databaseUrl);
  const databaseName = target.pathname.slice(1);
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";
  const admin = postgres(adminUrl.toString(), { max: 1 });
  try {
    const existing = await admin<ReadonlyArray<Readonly<{ one: number }>>>`
      SELECT 1 AS one FROM pg_database WHERE datname = ${databaseName}
    `;
    if (existing.length === 0) {
      await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }
}

export async function applyMigrations(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    const applied = await sql<ReadonlyArray<Readonly<{ name: string }>>>`
      SELECT name FROM _migrations
    `;
    const done = new Set(applied.map((row) => row.name));
    const files = (await readdir(MIGRATIONS_DIR))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    const pending = files.filter((file) => !done.has(file));
    await pending.reduce(async (previous, file) => {
      await previous;
      const content = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`INSERT INTO _migrations (name) VALUES (${file})`;
      });
    }, Promise.resolve());
  } finally {
    await sql.end();
  }
}
