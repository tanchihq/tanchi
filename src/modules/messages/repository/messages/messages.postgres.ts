import type { DbClient } from "@shared/db";
import { throwSanitizeError } from "@shared/utils";
import type {
  GetMessagesFilter,
  PgMessageHistoryRow,
} from "./messages.entities.ts";

export class MessagesPostgres {
  constructor(private readonly db: DbClient) {}

  async getMessages(
    filter: GetMessagesFilter
  ): Promise<ReadonlyArray<PgMessageHistoryRow>> {
    try {
      return await this.db<ReadonlyArray<PgMessageHistoryRow>>`
        SELECT
          m.id, m.lead_id, m.channel, m.subject, m.body, m.status,
          m.sent_at, m.created_at,
          l.first_name, l.last_name, c.name AS company_name,
          o.classification AS reply_classification
        FROM messages m
        JOIN leads l ON l.id = m.lead_id
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN LATERAL (
          SELECT classification FROM outcomes
          WHERE message_id = m.id AND classification IS NOT NULL
          ORDER BY created_at DESC LIMIT 1
        ) o ON TRUE
        WHERE m.organization_id = ${filter.organizationId}
          ${filter.status !== undefined ? this.db`AND m.status = ${filter.status}` : this.db``}
          ${filter.leadId !== undefined ? this.db`AND m.lead_id = ${filter.leadId}` : this.db``}
        ORDER BY COALESCE(m.sent_at, m.created_at) DESC
        LIMIT ${filter.limit}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
