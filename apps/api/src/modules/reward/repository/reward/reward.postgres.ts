import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  AdoptReplierInput,
  MarkLeadBouncedInput,
  PgRewardLead,
  PgRewardSender,
  PgRewardSentSubject,
  PgRewardThreadMatch,
  RecordReplyInput,
} from "./reward.entities.ts";

export class RewardPostgres {
  constructor(private readonly db: DbClient) {}

  async getAllActiveSenders(): Promise<ReadonlyArray<PgRewardSender>> {
    try {
      return await this.db<ReadonlyArray<PgRewardSender>>`
        SELECT id, organization_id, smtp_host, smtp_port, smtp_secure,
               imap_host, imap_port, imap_secure, username, secret_encrypted
        FROM senders
        WHERE status = 'active'
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getSenderAddresses(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<
        ReadonlyArray<Readonly<{ from_email: string; username: string }>>
      >`
        SELECT from_email, username FROM senders
        WHERE organization_id = ${organizationId}
      `;
      return result.flatMap((row) => [
        row.from_email.toLowerCase(),
        row.username.toLowerCase(),
      ]);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadById(
    organizationId: string,
    leadId: string
  ): Promise<PgRewardLead | null> {
    try {
      const result = await this.db<ReadonlyArray<PgRewardLead>>`
        SELECT id, stage, email, first_name, last_name FROM leads
        WHERE id = ${leadId} AND organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadByEmail(
    organizationId: string,
    email: string
  ): Promise<PgRewardLead | null> {
    try {
      const result = await this.db<ReadonlyArray<PgRewardLead>>`
        SELECT id, stage, email, first_name, last_name FROM leads
        WHERE organization_id = ${organizationId} AND LOWER(email) = ${email}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadsByEmailDomain(
    organizationId: string,
    domain: string
  ): Promise<ReadonlyArray<PgRewardLead>> {
    try {
      return await this.db<ReadonlyArray<PgRewardLead>>`
        SELECT id, stage, LOWER(email) AS email, first_name, last_name FROM leads
        WHERE organization_id = ${organizationId}
          AND SPLIT_PART(LOWER(email), '@', 2) = ${domain}
        ORDER BY created_at DESC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getSentMessagesByEmailMessageIds(
    organizationId: string,
    emailMessageIds: ReadonlyArray<string>
  ): Promise<ReadonlyArray<PgRewardThreadMatch>> {
    if (emailMessageIds.length === ARRAY.EMPTY_LENGTH) return [];
    try {
      return await this.db<ReadonlyArray<PgRewardThreadMatch>>`
        SELECT id AS message_id, lead_id FROM messages
        WHERE organization_id = ${organizationId}
          AND email_message_id = ANY(${[...emailMessageIds]})
          AND lead_id IS NOT NULL
        ORDER BY sent_at DESC NULLS LAST
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getRecentSentSubjects(
    organizationId: string,
    sinceDays: number
  ): Promise<ReadonlyArray<PgRewardSentSubject>> {
    try {
      return await this.db<ReadonlyArray<PgRewardSentSubject>>`
        SELECT id AS message_id, lead_id, subject FROM messages
        WHERE organization_id = ${organizationId}
          AND status = 'sent'
          AND channel = 'email'
          AND subject IS NOT NULL
          AND lead_id IS NOT NULL
          AND sent_at >= NOW() - MAKE_INTERVAL(days => ${sinceDays})
        ORDER BY sent_at DESC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async hasProcessedReply(
    organizationId: string,
    replyMessageId: string
  ): Promise<boolean> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ count: number }>>>`
        SELECT COUNT(*)::int AS count FROM outcomes
        WHERE organization_id = ${organizationId}
          AND reply_message_id = ${replyMessageId}
      `;
      return (result[ARRAY.FIRST_INDEX]?.count ?? 0) > 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLatestSentMessageId(
    organizationId: string,
    leadId: string
  ): Promise<string | null> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ id: string }>>>`
        SELECT id FROM messages
        WHERE lead_id = ${leadId}
          AND organization_id = ${organizationId}
          AND status = 'sent'
        ORDER BY sent_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX]?.id ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async recordReply(input: RecordReplyInput): Promise<boolean> {
    try {
      return await this.db.begin(async (tx) => {
        const inserted = await tx<ReadonlyArray<Readonly<{ id: string }>>>`
          INSERT INTO outcomes (
            id, organization_id, message_id, lead_id, stage_signal,
            classification, reply_text, reply_message_id, reply_from
          )
          VALUES (
            ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.messageId},
            ${input.leadId}, 'replied', ${input.classification}, ${input.replyText},
            ${input.replyMessageId}, ${input.replyFrom}
          )
          ON CONFLICT (organization_id, reply_message_id)
            WHERE reply_message_id IS NOT NULL
          DO NOTHING
          RETURNING id
        `;
        if (inserted.length === ARRAY.EMPTY_LENGTH) return false;
        await tx`
          UPDATE leads
          SET stage = ${input.stage}, origin = 'auto', next_follow_up_at = NULL,
              updated_at = NOW()
          WHERE id = ${input.leadId}
            AND organization_id = ${input.organizationId}
        `;
        await tx`
          UPDATE messages
          SET status = 'skipped', skip_reason = 'lead_replied', updated_at = NOW()
          WHERE lead_id = ${input.leadId}
            AND organization_id = ${input.organizationId}
            AND status IN ('draft', 'edited')
        `;
        return true;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async adoptReplier(input: AdoptReplierInput): Promise<void> {
    try {
      await this.db`
        UPDATE leads
        SET email = ${input.email},
            first_name = COALESCE(first_name, ${input.firstName}),
            last_name = COALESCE(last_name, ${input.lastName}),
            updated_at = NOW()
        WHERE id = ${input.leadId}
          AND organization_id = ${input.organizationId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getBounceCandidateByThread(
    organizationId: string,
    recipient: string,
    originalMessageId: string
  ): Promise<PgRewardLead | null> {
    try {
      const result = await this.db<ReadonlyArray<PgRewardLead>>`
        SELECT l.id, l.stage, l.email, l.first_name, l.last_name
        FROM messages m
        JOIN leads l ON l.id = m.lead_id
        WHERE m.organization_id = ${organizationId}
          AND m.email_message_id = ${originalMessageId}
          AND LOWER(l.email) = ${recipient}
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getBounceCandidateByEmail(
    organizationId: string,
    recipient: string
  ): Promise<PgRewardLead | null> {
    try {
      const result = await this.db<ReadonlyArray<PgRewardLead>>`
        SELECT l.id, l.stage, l.email, l.first_name, l.last_name
        FROM leads l
        WHERE l.organization_id = ${organizationId}
          AND LOWER(l.email) = ${recipient}
          AND EXISTS (
            SELECT 1 FROM messages m
            WHERE m.lead_id = l.id AND m.status = 'sent' AND m.channel = 'email'
          )
        ORDER BY l.created_at DESC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async markLeadBounced(input: MarkLeadBouncedInput): Promise<void> {
    try {
      await this.db.begin(async (tx) => {
        await tx`
          UPDATE leads
          SET stage = 'bounced', origin = 'auto', next_follow_up_at = NULL,
              updated_at = NOW()
          WHERE id = ${input.leadId}
            AND organization_id = ${input.organizationId}
        `;
        await tx`
          INSERT INTO exclusions (id, organization_id, scope, email, reason)
          VALUES (
            ${Bun.randomUUIDv7()}, ${input.organizationId}, 'person',
            ${input.email.toLowerCase()}, ${input.reason}
          )
          ON CONFLICT (organization_id, email) WHERE scope = 'person'
          DO NOTHING
        `;
        await tx`
          UPDATE messages
          SET status = 'skipped', skip_reason = 'address_bounced', updated_at = NOW()
          WHERE lead_id = ${input.leadId}
            AND organization_id = ${input.organizationId}
            AND status IN ('draft', 'edited')
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
