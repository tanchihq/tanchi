import postgres, { type Sql } from "postgres";

export type DbClient = Sql;

interface CreateDbClientOptions {
  databaseUrl: string;
}

export function createDbClient({
  databaseUrl,
}: CreateDbClientOptions): DbClient {
  return postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}
