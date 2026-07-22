import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  PgRewardDomainLead,
  PgRewardLead,
  PgRewardSender,
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

  async getLeadByEmail(
    organizationId: string,
    email: string
  ): Promise<PgRewardLead | null> {
    try {
      const result = await this.db<ReadonlyArray<PgRewardLead>>`
        SELECT id, stage FROM leads
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
  ): Promise<ReadonlyArray<PgRewardDomainLead>> {
    try {
      return await this.db<ReadonlyArray<PgRewardDomainLead>>`
        SELECT id, stage, LOWER(email) AS email FROM leads
        WHERE organization_id = ${organizationId}
          AND SPLIT_PART(LOWER(email), '@', 2) = ${domain}
        ORDER BY created_at DESC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async hasRepliedOutcome(leadId: string): Promise<boolean> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ count: number }>>>`
        SELECT COUNT(*)::int AS count FROM outcomes
        WHERE lead_id = ${leadId} AND stage_signal = 'replied'
      `;
      return (result[ARRAY.FIRST_INDEX]?.count ?? 0) > 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLatestSentMessageId(leadId: string): Promise<string | null> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ id: string }>>>`
        SELECT id FROM messages
        WHERE lead_id = ${leadId} AND status = 'sent'
        ORDER BY sent_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX]?.id ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async recordReply(input: RecordReplyInput): Promise<void> {
    try {
      await this.db.begin(async (tx) => {
        await tx`
          INSERT INTO outcomes (
            id, organization_id, message_id, lead_id, stage_signal,
            classification, reply_text
          )
          VALUES (
            ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.messageId},
            ${input.leadId}, 'replied', ${input.classification}, ${input.replyText}
          )
        `;
        await tx`
          UPDATE leads SET stage = ${input.stage}, updated_at = NOW()
          WHERE id = ${input.leadId}
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
