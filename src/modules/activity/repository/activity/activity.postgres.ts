import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type { PgActivity, PgActivityStatusRow } from "./activity.entities.ts";

export class ActivityPostgres {
  constructor(private readonly db: DbClient) {}

  async getRecentActivity(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgActivity>> {
    try {
      return await this.db<ReadonlyArray<PgActivity>>`
        SELECT id, type, title, lead_id, created_at
        FROM activity
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getStatusRow(
    organizationId: string
  ): Promise<PgActivityStatusRow | null> {
    try {
      const result = await this.db<ReadonlyArray<PgActivityStatusRow>>`
        SELECT
          MAX(created_at) FILTER (WHERE type = 'run_started') AS last_run_started,
          MAX(created_at) FILTER (WHERE type = 'run_done') AS last_run_done,
          COUNT(*) FILTER (WHERE type = 'profiled' AND created_at >= CURRENT_DATE)::int AS researched_today,
          COUNT(*) FILTER (WHERE type = 'drafted' AND created_at >= CURRENT_DATE)::int AS drafted_today,
          COUNT(*) FILTER (WHERE type = 'sent' AND created_at >= CURRENT_DATE)::int AS sent_today,
          COUNT(*) FILTER (WHERE type = 'reply' AND created_at >= CURRENT_DATE)::int AS replies_today
        FROM activity
        WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
