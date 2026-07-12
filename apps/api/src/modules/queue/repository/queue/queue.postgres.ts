import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  ApplyEditInput,
  MarkSentAndAdvanceInput,
  PgQueueFact,
  PgQueueRow,
  PgQueueSenderCred,
} from "./queue.entities.ts";

export class QueuePostgres {
  constructor(private readonly db: DbClient) {}

  async getQueueRowsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgQueueRow>> {
    try {
      const result = await this.db<ReadonlyArray<PgQueueRow>>`
        SELECT
          m.id AS message_id, m.lead_id, m.organization_id,
          l.first_name, l.last_name, l.role, m.channel, l.hot,
          m.status, m.subject, m.body, m.angle_type,
          m.created_at AS message_created_at,
          c.name AS company_name, l.email
        FROM messages m
        JOIN leads l ON l.id = m.lead_id
        LEFT JOIN companies c ON c.id = l.company_id
        WHERE m.organization_id = ${organizationId}
          AND m.status IN ('draft', 'edited')
          AND l.excluded_at IS NULL
        ORDER BY m.created_at DESC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOneQueueRowByLead(leadId: string): Promise<PgQueueRow | null> {
    try {
      const result = await this.db<ReadonlyArray<PgQueueRow>>`
        SELECT
          m.id AS message_id, m.lead_id, m.organization_id,
          l.first_name, l.last_name, l.role, m.channel, l.hot,
          m.status, m.subject, m.body, m.angle_type,
          m.created_at AS message_created_at,
          c.name AS company_name, l.email
        FROM messages m
        JOIN leads l ON l.id = m.lead_id
        LEFT JOIN companies c ON c.id = l.company_id
        WHERE m.lead_id = ${leadId}
          AND m.status IN ('draft', 'edited')
          AND l.excluded_at IS NULL
        ORDER BY m.created_at DESC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getFactsForLeads(
    leadIds: ReadonlyArray<string>
  ): Promise<ReadonlyArray<PgQueueFact>> {
    if (leadIds.length === ARRAY.EMPTY_LENGTH) return [];
    try {
      const result = await this.db<ReadonlyArray<PgQueueFact>>`
        SELECT d.lead_id, df.text, df.source_url
        FROM dossier_facts df
        JOIN dossiers d ON d.id = df.dossier_id
        WHERE d.lead_id = ANY(${[...leadIds]})
        ORDER BY df.created_at ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getFirstActiveSenderByOrganization(
    organizationId: string
  ): Promise<PgQueueSenderCred | null> {
    try {
      const result = await this.db<ReadonlyArray<PgQueueSenderCred>>`
        SELECT id, from_name, from_email, smtp_host, smtp_port, smtp_secure,
               imap_host, imap_port, imap_secure, username, secret_encrypted, signature
        FROM senders
        WHERE organization_id = ${organizationId} AND status = 'active'
        ORDER BY created_at ASC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getActiveSenderById(
    organizationId: string,
    senderId: string
  ): Promise<PgQueueSenderCred | null> {
    try {
      const result = await this.db<ReadonlyArray<PgQueueSenderCred>>`
        SELECT id, from_name, from_email, smtp_host, smtp_port, smtp_secure,
               imap_host, imap_port, imap_secure, username, secret_encrypted, signature
        FROM senders
        WHERE id = ${senderId} AND organization_id = ${organizationId}
          AND status = 'active'
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async markSentAndAdvance(input: MarkSentAndAdvanceInput): Promise<void> {
    try {
      await this.db.begin(async (tx) => {
        await tx`
          UPDATE messages
          SET status = 'sent', sent_at = NOW(), sender_id = ${input.senderId},
              updated_at = NOW()
          WHERE id = ${input.messageId}
        `;
        await tx`
          INSERT INTO outcomes (id, organization_id, message_id, lead_id, stage_signal)
          VALUES (
            ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.messageId},
            ${input.leadId}, 'sent'
          )
        `;
        await tx`
          UPDATE leads
          SET stage = 'contacted', sequence_step = sequence_step + 1,
              next_follow_up_at = NULL, updated_at = NOW()
          WHERE id = ${input.leadId}
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async applyEdit(input: ApplyEditInput): Promise<void> {
    try {
      await this.db.begin(async (tx) => {
        if (input.editedVersion !== input.aiVersion) {
          await tx`
            INSERT INTO edits (id, organization_id, message_id, ai_version, edited_version)
            VALUES (
              ${Bun.randomUUIDv7()},
              ${input.organizationId},
              ${input.messageId},
              ${input.aiVersion},
              ${input.editedVersion}
            )
          `;
        }
        await tx`
          UPDATE messages
          SET body = ${input.editedVersion}, status = 'edited', updated_at = NOW()
          WHERE id = ${input.messageId}
        `;
        if (input.subject !== undefined) {
          await tx`
            UPDATE messages
            SET subject = ${input.subject}, updated_at = NOW()
            WHERE id = ${input.messageId}
          `;
        }
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
