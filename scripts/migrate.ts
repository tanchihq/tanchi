import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closeDb, db } from "../src/db.ts";

const ARRAY_EMPTY = 0;

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../migrations");

async function ensureMigrationsTable(): Promise<void> {
  await db`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await db<Array<{ name: string }>>`SELECT name FROM _migrations`;
  return new Set(rows.map((r) => r.name));
}

async function applyMigration(name: string, content: string): Promise<void> {
  console.log(`→ Applying ${name}...`);
  await db.begin(async (tx) => {
    await tx.unsafe(content);
    await tx`INSERT INTO _migrations (name) VALUES (${name})`;
  });
  console.log(`✓ ${name} applied`);
}

async function main(): Promise<void> {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = ARRAY_EMPTY;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`⊙ ${file} already applied, skipping`);
        continue;
      }
      const content = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
      await applyMigration(file, content);
      count++;
    }

    console.log(`\nDone. ${count} migration(s) applied.`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
