import type { SuppressionPostgres } from "./suppression.postgres.ts";
import type {
  PgDeletedExclusion,
  PgExclusionEntry,
} from "./suppression.entities.ts";

export class SuppressionRepository {
  constructor(private readonly suppressionPostgres: SuppressionPostgres) {}

  insertPersonExclusions(
    organizationId: string,
    emails: ReadonlyArray<string>
  ): Promise<number> {
    return this.suppressionPostgres.insertPersonExclusions(
      organizationId,
      emails
    );
  }

  getExclusions(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgExclusionEntry>> {
    return this.suppressionPostgres.getExclusions(organizationId, limit);
  }

  deleteExclusion(
    organizationId: string,
    id: string
  ): Promise<PgDeletedExclusion | null> {
    return this.suppressionPostgres.deleteExclusion(organizationId, id);
  }

  clearLeadExclusionByEmail(
    organizationId: string,
    email: string
  ): Promise<void> {
    return this.suppressionPostgres.clearLeadExclusionByEmail(
      organizationId,
      email
    );
  }

  clearLeadExclusionByDomain(
    organizationId: string,
    domain: string
  ): Promise<void> {
    return this.suppressionPostgres.clearLeadExclusionByDomain(
      organizationId,
      domain
    );
  }
}
