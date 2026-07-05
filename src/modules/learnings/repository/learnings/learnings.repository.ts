import type { LearningsPostgres } from "./learnings.postgres.ts";
import type { PgIcpLearning } from "./learnings.entities.ts";

export class LearningsRepository {
  constructor(private readonly learningsPostgres: LearningsPostgres) {}

  getIcpLearningsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgIcpLearning>> {
    return this.learningsPostgres.getIcpLearningsByOrganization(
      organizationId
    );
  }
}
