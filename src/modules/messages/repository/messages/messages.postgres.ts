import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  GetMessagesFilter,
  PgEditableMessage,
  PgMessageHistoryRow,
  SaveMessageEditInput,
} from "./messages.entities.ts";

export class MessagesPostgres {
  constructor(private readonly db: DbClient) {}

  async getEditableMessageById(
    id: string
  ): Promise<PgEditableMessage | null> {
    try {
      const result = await this.db<ReadonlyArray<PgEditableMessage>>`
        SELECT id, organization_id, subject, body, status
        FROM messages WHERE id = ${id}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOriginalAiVersion(messageId: string): Promise<string | null> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ ai_version: string }>>>`
        SELECT ai_version FROM edits
        WHERE message_id = ${messageId}
        ORDER BY created_at ASC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX]?.ai_version ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async saveMessageEdit(
    input: SaveMessageEditInput
  ): Promise<PgEditableMessage | null> {
    try {
      return await this.db.begin(async (tx) => {
        if (input.aiVersion !== input.body) {
          await tx`
            INSERT INTO edits (id, organization_id, message_id, ai_version, edited_version)
            VALUES (
              ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.messageId},
              ${input.aiVersion}, ${input.body}
            )
          `;
        }
        const updated = await tx<ReadonlyArray<PgEditableMessage>>`
          UPDATE messages
          SET body = ${input.body}, subject = ${input.subject},
              status = 'edited', updated_at = NOW()
          WHERE id = ${input.messageId}
          RETURNING id, organization_id, subject, body, status
        `;
        return updated[ARRAY.FIRST_INDEX] ?? null;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

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
