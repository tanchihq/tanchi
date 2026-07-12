import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  PgDeletedExclusion,
  PgExclusionEntry,
} from "./suppression.entities.ts";

export class SuppressionPostgres {
  constructor(private readonly db: DbClient) {}

  async insertPersonExclusions(
    organizationId: string,
    emails: ReadonlyArray<string>
  ): Promise<number> {
    if (emails.length === ARRAY.EMPTY_LENGTH) return 0;
    const rows = emails.map((email) => ({
      id: Bun.randomUUIDv7(),
      organization_id: organizationId,
      scope: "person",
      email,
    }));
    try {
      const result = await this.db`
        INSERT INTO exclusions ${this.db(
          rows,
          "id",
          "organization_id",
          "scope",
          "email"
        )}
        ON CONFLICT (organization_id, email) WHERE scope = 'person'
        DO NOTHING
      `;
      return result.count ?? 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getExclusions(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgExclusionEntry>> {
    try {
      return await this.db<ReadonlyArray<PgExclusionEntry>>`
        SELECT id, scope, email, company_domain, reason, created_at
        FROM exclusions
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async deleteExclusion(
    organizationId: string,
    id: string
  ): Promise<PgDeletedExclusion | null> {
    try {
      const result = await this.db<ReadonlyArray<PgDeletedExclusion>>`
        DELETE FROM exclusions
        WHERE id = ${id} AND organization_id = ${organizationId}
        RETURNING scope, email, company_domain
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async clearLeadExclusionByEmail(
    organizationId: string,
    email: string
  ): Promise<void> {
    try {
      await this.db`
        UPDATE leads
        SET excluded_at = NULL, updated_at = NOW()
        WHERE organization_id = ${organizationId}
          AND LOWER(email) = ${email.toLowerCase()}
          AND excluded_at IS NOT NULL
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async clearLeadExclusionByDomain(
    organizationId: string,
    domain: string
  ): Promise<void> {
    try {
      await this.db`
        UPDATE leads
        SET excluded_at = NULL, updated_at = NOW()
        WHERE organization_id = ${organizationId}
          AND excluded_at IS NOT NULL
          AND company_id IN (
            SELECT id FROM companies
            WHERE organization_id = ${organizationId}
              AND LOWER(domain) = ${domain.toLowerCase()}
          )
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
