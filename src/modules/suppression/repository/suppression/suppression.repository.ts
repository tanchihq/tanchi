import type { SuppressionPostgres } from "./suppression.postgres.ts";
import type { PgSuppressionEntry } from "./suppression.entities.ts";

export class SuppressionRepository {
  constructor(private readonly suppressionPostgres: SuppressionPostgres) {}

  insertSuppressions(
    organizationId: string,
    emails: ReadonlyArray<string>
  ): Promise<number> {
    return this.suppressionPostgres.insertSuppressions(
      organizationId,
      emails
    );
  }

  getSuppressionList(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgSuppressionEntry>> {
    return this.suppressionPostgres.getSuppressionList(organizationId, limit);
  }
}
