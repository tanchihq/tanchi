import type { DbClient } from "@shared/db";
import { throwSanitizeError } from "@shared/utils";
import type { PgIcpLearning } from "./learnings.entities.ts";

export class LearningsPostgres {
  constructor(private readonly db: DbClient) {}

  async getIcpLearningsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgIcpLearning>> {
    try {
      const result = await this.db<ReadonlyArray<PgIcpLearning>>`
        SELECT
          i.name AS icp_name,
          latest.content AS content
        FROM icp i
        LEFT JOIN LATERAL (
          SELECT content
          FROM playbook p
          WHERE p.organization_id = i.organization_id
            AND p.icp_id = i.id
          ORDER BY p.version DESC
          LIMIT 1
        ) latest ON TRUE
        WHERE i.organization_id = ${organizationId}
        ORDER BY i.position ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
