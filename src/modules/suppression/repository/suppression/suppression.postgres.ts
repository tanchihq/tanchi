import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type { PgSuppressionEntry } from "./suppression.entities.ts";

export class SuppressionPostgres {
  constructor(private readonly db: DbClient) {}

  async insertSuppressions(
    organizationId: string,
    emails: ReadonlyArray<string>
  ): Promise<number> {
    if (emails.length === ARRAY.EMPTY_LENGTH) return 0;
    const rows = emails.map((email) => ({
      id: Bun.randomUUIDv7(),
      organization_id: organizationId,
      email,
    }));
    try {
      const result = await this.db`
        INSERT INTO suppression_list ${this.db(
          rows,
          "id",
          "organization_id",
          "email"
        )}
        ON CONFLICT (organization_id, email) DO NOTHING
      `;
      return result.count ?? 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getSuppressionList(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgSuppressionEntry>> {
    try {
      return await this.db<ReadonlyArray<PgSuppressionEntry>>`
        SELECT email, created_at FROM suppression_list
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
