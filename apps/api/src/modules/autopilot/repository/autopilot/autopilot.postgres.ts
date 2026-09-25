import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import { SEND_CLAIM_TTL_MINUTES } from "../../autopilot.constants.ts";
import type {
  MarkSentAutomaticallyInput,
  PgAutopilotCandidate,
  PgAutopilotSender,
  PgAutopilotSettings,
} from "./autopilot.entities.ts";

export class AutopilotPostgres {
  constructor(private readonly db: DbClient) {}

  private eligibleDraftSource(organizationId: string) {
    return this.db`
      FROM messages m
      JOIN leads l ON l.id = m.lead_id
      LEFT JOIN icp i ON i.id = l.icp_id
      LEFT JOIN market mk ON mk.id = i.market_id
      WHERE m.organization_id = ${organizationId}
        AND m.status IN ('draft', 'edited')
        AND m.channel = 'email'
        AND l.email IS NOT NULL
        AND l.excluded_at IS NULL
        AND l.stage IN ('identified', 'contacted', 'following-up')
        AND (
          m.send_claimed_at IS NULL
          OR m.send_claimed_at < NOW() - MAKE_INTERVAL(mins => ${SEND_CLAIM_TTL_MINUTES})
        )
        AND NOT EXISTS (
          SELECT 1 FROM exclusions e
          WHERE e.organization_id = m.organization_id
            AND (
              (e.scope = 'person' AND e.email = LOWER(l.email))
              OR (
                e.scope = 'company'
                AND e.company_domain = SPLIT_PART(LOWER(l.email), '@', 2)
              )
            )
        )
    `;
  }

  async getSettings(
    organizationId: string
  ): Promise<PgAutopilotSettings | null> {
    try {
      const result = await this.db<ReadonlyArray<PgAutopilotSettings>>`
        SELECT autopilot_enabled, autopilot_updated_at
        FROM organization_profile
        WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async updateEnabled(
    organizationId: string,
    enabled: boolean
  ): Promise<boolean> {
    try {
      const result = await this.db<
        ReadonlyArray<Readonly<{ organization_id: string }>>
      >`
        UPDATE organization_profile
        SET autopilot_enabled = ${enabled}, autopilot_updated_at = NOW(),
            updated_at = NOW()
        WHERE organization_id = ${organizationId}
        RETURNING organization_id
      `;
      return result.length > ARRAY.EMPTY_LENGTH;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getEnabledOrganizationIds(): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<
        ReadonlyArray<Readonly<{ organization_id: string }>>
      >`
        SELECT organization_id FROM organization_profile
        WHERE autopilot_enabled = TRUE
      `;
      return result.map((row) => row.organization_id);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getIcpNamesWithoutPlaybook(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ name: string }>>>`
        SELECT i.name FROM icp i
        WHERE i.organization_id = ${organizationId}
          AND NOT EXISTS (
            SELECT 1 FROM playbook p
            WHERE p.organization_id = i.organization_id
              AND p.icp_id = i.id
              AND TRIM(p.content) <> ''
          )
        ORDER BY i.position ASC
      `;
      return result.map((row) => row.name);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getSenderStats(
    organizationId: string,
    bounceWindowDays: number
  ): Promise<ReadonlyArray<PgAutopilotSender>> {
    try {
      return await this.db<ReadonlyArray<PgAutopilotSender>>`
        SELECT
          s.id, s.from_name, s.from_email, s.smtp_host, s.smtp_port,
          s.smtp_secure, s.imap_host, s.imap_port, s.imap_secure, s.username,
          s.secret_encrypted, s.signature, s.daily_cap,
          COUNT(m.id) FILTER (
            WHERE m.sent_at >= NOW() - INTERVAL '24 hours'
          )::int AS sent_last_24h,
          MAX(m.sent_at) AS last_sent_at,
          COUNT(m.id) FILTER (
            WHERE m.sent_at >= NOW() - MAKE_INTERVAL(days => ${bounceWindowDays})
          )::int AS sent_in_window,
          COUNT(m.id) FILTER (
            WHERE m.sent_at >= NOW() - MAKE_INTERVAL(days => ${bounceWindowDays})
              AND l.stage = 'bounced'
          )::int AS bounced_in_window
        FROM senders s
        LEFT JOIN messages m
          ON m.sender_id = s.id
          AND m.organization_id = s.organization_id
          AND m.status = 'sent'
        LEFT JOIN leads l ON l.id = m.lead_id
        WHERE s.organization_id = ${organizationId}
          AND s.status = 'active'
        GROUP BY s.id
        ORDER BY s.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async countEligibleDrafts(organizationId: string): Promise<number> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ count: number }>>>`
        SELECT COUNT(*)::int AS count
        ${this.eligibleDraftSource(organizationId)}
      `;
      return result[ARRAY.FIRST_INDEX]?.count ?? 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getCandidates(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgAutopilotCandidate>> {
    try {
      return await this.db<ReadonlyArray<PgAutopilotCandidate>>`
        SELECT
          m.id AS message_id, m.lead_id, m.subject, m.body, l.email,
          l.sequence_step,
          COALESCE(mk.country, 'US') AS country,
          COALESCE(mk.excluded_weekdays, '{0,6}') AS excluded_weekdays,
          (
            SELECT p.sender_id FROM messages p
            WHERE p.lead_id = l.id AND p.status = 'sent'
            ORDER BY p.sent_at DESC NULLS LAST
            LIMIT 1
          ) AS previous_sender_id
        ${this.eligibleDraftSource(organizationId)}
        ORDER BY (l.sequence_step > 0) DESC, l.score DESC NULLS LAST, m.created_at ASC
        LIMIT ${limit}
      `;
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

  async markSentAutomatically(input: MarkSentAutomaticallyInput): Promise<void> {
    try {
      await this.db.begin(async (tx) => {
        await tx`
          UPDATE messages
          SET status = 'sent', sent_at = NOW(), sender_id = ${input.senderId},
              email_message_id = ${input.emailMessageId},
              sent_automatically = TRUE, send_claimed_at = NULL,
              updated_at = NOW()
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
              origin = 'auto',
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
}
