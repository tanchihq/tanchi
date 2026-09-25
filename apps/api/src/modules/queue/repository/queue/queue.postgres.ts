import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import {
  SEND_CLAIM_TTL_MINUTES,
  WRONG_LEAD_EXCLUSION_REASON,
} from "../../queue.constants.ts";
import type {
  ApplyEditInput,
  MarkSentAndAdvanceInput,
  PgQueueFact,
  PgQueueRow,
  PgQueueSenderCred,
  SkipDraftInput,
} from "./queue.entities.ts";

export class QueuePostgres {
  constructor(private readonly db: DbClient) {}

  private queueRowSource() {
    return this.db`
      SELECT
        m.id AS message_id, m.lead_id, m.organization_id,
        l.first_name, l.last_name, l.role, m.channel, l.hot,
        m.status, m.subject, m.body, m.angle_type,
        m.created_at AS message_created_at,
        c.name AS company_name, l.email, l.linkedin_url, l.instagram_url,
        l.score, l.qualification, l.sequence_step,
        previous.subject AS previous_subject,
        previous.body AS previous_body,
        previous.sent_at AS previous_sent_at,
        angle.title AS angle_title,
        angle.note AS angle_note,
        fact.text AS angle_fact_text,
        fact.source_url AS angle_fact_source_url
      FROM messages m
      JOIN leads l ON l.id = m.lead_id
      LEFT JOIN companies c ON c.id = l.company_id
      LEFT JOIN LATERAL (
        SELECT p.subject, p.body, p.sent_at FROM messages p
        WHERE p.lead_id = m.lead_id AND p.status = 'sent'
        ORDER BY p.sent_at DESC NULLS LAST
        LIMIT 1
      ) previous ON TRUE
      LEFT JOIN LATERAL (
        SELECT da.title, da.note, da.fact_id FROM dossier_angles da
        JOIN dossiers d ON d.id = da.dossier_id
        WHERE d.lead_id = m.lead_id AND da.chosen
        ORDER BY da.rank ASC
        LIMIT 1
      ) angle ON TRUE
      LEFT JOIN dossier_facts fact ON fact.id = angle.fact_id
    `;
  }

  async getQueueRowsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgQueueRow>> {
    try {
      return await this.db<ReadonlyArray<PgQueueRow>>`
        ${this.queueRowSource()}
        WHERE m.organization_id = ${organizationId}
          AND m.status IN ('draft', 'edited')
          AND l.excluded_at IS NULL
          AND l.stage IN ('identified', 'contacted', 'following-up')
        ORDER BY
          (m.channel = 'email') DESC,
          (l.sequence_step > 0) DESC,
          l.score DESC NULLS LAST,
          m.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOneQueueRowByLead(leadId: string): Promise<PgQueueRow | null> {
    try {
      const result = await this.db<ReadonlyArray<PgQueueRow>>`
        ${this.queueRowSource()}
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

  async isAutopilotEnabled(organizationId: string): Promise<boolean> {
    try {
      const result = await this.db<
        ReadonlyArray<Readonly<{ autopilot_enabled: boolean }>>
      >`
        SELECT autopilot_enabled FROM organization_profile
        WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX]?.autopilot_enabled ?? false;
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

  async getLastActiveSenderForLead(
    organizationId: string,
    leadId: string
  ): Promise<PgQueueSenderCred | null> {
    try {
      const result = await this.db<ReadonlyArray<PgQueueSenderCred>>`
        SELECT s.id, s.from_name, s.from_email, s.smtp_host, s.smtp_port,
               s.smtp_secure, s.imap_host, s.imap_port, s.imap_secure,
               s.username, s.secret_encrypted, s.signature
        FROM messages m
        JOIN senders s ON s.id = m.sender_id
        WHERE m.lead_id = ${leadId}
          AND m.organization_id = ${organizationId}
          AND m.status = 'sent'
          AND s.organization_id = ${organizationId}
          AND s.status = 'active'
        ORDER BY m.sent_at DESC NULLS LAST
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getThreadMessageIds(
    organizationId: string,
    leadId: string
  ): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<
        ReadonlyArray<Readonly<{ email_message_id: string }>>
      >`
        SELECT email_message_id FROM messages
        WHERE lead_id = ${leadId}
          AND organization_id = ${organizationId}
          AND status = 'sent'
          AND channel = 'email'
          AND email_message_id IS NOT NULL
        ORDER BY sent_at ASC NULLS LAST
      `;
      return result.map((row) => row.email_message_id);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async claimDraft(
    organizationId: string,
    messageId: string
  ): Promise<boolean> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ id: string }>>>`
        UPDATE messages
        SET send_claimed_at = NOW()
        WHERE id = ${messageId}
          AND organization_id = ${organizationId}
          AND status IN ('draft', 'edited')
          AND (
            send_claimed_at IS NULL
            OR send_claimed_at < NOW() - MAKE_INTERVAL(mins => ${SEND_CLAIM_TTL_MINUTES})
          )
        RETURNING id
      `;
      return result.length > ARRAY.EMPTY_LENGTH;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async releaseDraft(organizationId: string, messageId: string): Promise<void> {
    try {
      await this.db`
        UPDATE messages SET send_claimed_at = NULL
        WHERE id = ${messageId} AND organization_id = ${organizationId}
      `;
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
              email_message_id = ${input.emailMessageId},
              send_claimed_at = NULL, updated_at = NOW()
          WHERE id = ${input.messageId}
            AND organization_id = ${input.organizationId}
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
          SET stage = CASE
                WHEN stage IN ('replied', 'meeting', 'won') THEN stage
                WHEN sequence_step = 0 THEN 'contacted'
                ELSE 'following-up'
              END,
              sequence_step = sequence_step + 1,
              next_follow_up_at = NULL, updated_at = NOW()
          WHERE id = ${input.leadId}
            AND organization_id = ${input.organizationId}
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
            AND organization_id = ${input.organizationId}
        `;
        if (input.subject !== undefined) {
          await tx`
            UPDATE messages
            SET subject = ${input.subject}, updated_at = NOW()
            WHERE id = ${input.messageId}
              AND organization_id = ${input.organizationId}
          `;
        }
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async skipDraft(input: SkipDraftInput): Promise<boolean> {
    try {
      return await this.db.begin(async (tx) => {
        const skipped = await tx<ReadonlyArray<Readonly<{ id: string }>>>`
          UPDATE messages
          SET status = 'skipped', skip_reason = ${input.reason}, updated_at = NOW()
          WHERE id = ${input.messageId}
            AND organization_id = ${input.organizationId}
            AND status IN ('draft', 'edited')
            AND (
              send_claimed_at IS NULL
              OR send_claimed_at < NOW() - MAKE_INTERVAL(mins => ${SEND_CLAIM_TTL_MINUTES})
            )
          RETURNING id
        `;
        if (skipped.length === ARRAY.EMPTY_LENGTH) return false;

        if (input.reason === "wrong_lead") {
          if (input.email !== null) {
            await tx`
              INSERT INTO exclusions (id, organization_id, scope, email, reason)
              VALUES (
                ${Bun.randomUUIDv7()}, ${input.organizationId}, 'person',
                ${input.email.toLowerCase()}, ${WRONG_LEAD_EXCLUSION_REASON}
              )
              ON CONFLICT (organization_id, email) WHERE scope = 'person'
              DO NOTHING
            `;
          }
          await tx`
            UPDATE leads SET excluded_at = NOW(), updated_at = NOW()
            WHERE id = ${input.leadId}
              AND organization_id = ${input.organizationId}
          `;
        }

        if (input.reason === "not_now") {
          await tx`
            UPDATE leads
            SET stage = 'snoozed', origin = 'manual', next_follow_up_at = NULL,
                updated_at = NOW()
            WHERE id = ${input.leadId}
              AND organization_id = ${input.organizationId}
          `;
        }

        if (input.reason === "wrong_angle") {
          await tx`
            WITH current_angle AS (
              SELECT da.dossier_id,
                     COALESCE(MAX(da.rank) FILTER (WHERE da.chosen), 0) AS chosen_rank
              FROM dossier_angles da
              JOIN dossiers d ON d.id = da.dossier_id
              WHERE d.lead_id = ${input.leadId}
                AND d.organization_id = ${input.organizationId}
              GROUP BY da.dossier_id
            ),
            next_angle AS (
              SELECT da.id, da.dossier_id
              FROM dossier_angles da
              JOIN current_angle ca ON ca.dossier_id = da.dossier_id
              WHERE da.rank > ca.chosen_rank
              ORDER BY da.rank ASC
              LIMIT 1
            )
            UPDATE dossier_angles da
            SET chosen = (da.id = next_angle.id)
            FROM next_angle
            WHERE da.dossier_id = next_angle.dossier_id
          `;
        }
        return true;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
