import type { ActivityPostgres } from "./activity.postgres.ts";
import type { PgActivity, PgActivityStatusRow } from "./activity.entities.ts";

export class ActivityRepository {
  constructor(private readonly activityPostgres: ActivityPostgres) {}

  getRecentActivity(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgActivity>> {
    return this.activityPostgres.getRecentActivity(organizationId, limit);
  }

  getStatusRow(organizationId: string): Promise<PgActivityStatusRow | null> {
    return this.activityPostgres.getStatusRow(organizationId);
  }
}
