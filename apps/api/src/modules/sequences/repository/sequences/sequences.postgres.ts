import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  CreateFollowUpDraftInput,
  PgDueLead,
  PgSequenceFact,
} from "./sequences.entities.ts";

export class SequencesPostgres {
  constructor(private readonly db: DbClient) {}

  async getAllOrganizationIds(): Promise<ReadonlyArray<string>> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ id: string }>>>`
        SELECT id FROM organization
      `;
      return result.map((row) => row.id);
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getDueLeads(
    organizationId: string
  ): Promise<ReadonlyArray<PgDueLead>> {
    try {
      return await this.db<ReadonlyArray<PgDueLead>>`
        SELECT
          l.id, l.organization_id, l.first_name, l.last_name, l.role,
          l.channel, l.icp_id, l.sequence_step,
          c.name AS company_name,
          (SELECT MAX(m.sent_at) FROM messages m WHERE m.lead_id = l.id) AS last_sent_at,
          COALESCE(mk.outreach_language, 'en') AS outreach_language,
          COALESCE(mk.company_profile, '') AS company_profile,
          COALESCE(mk.follow_up_intervals, '{3,4}') AS follow_up_intervals,
          COALESCE(mk.excluded_weekdays, '{0,6}') AS excluded_weekdays,
          COALESCE(op.website, '') AS website,
          o.name AS org_name
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN icp i ON i.id = l.icp_id
        LEFT JOIN market mk ON mk.id = i.market_id
        JOIN organization o ON o.id = l.organization_id
        LEFT JOIN organization_profile op ON op.organization_id = l.organization_id
        WHERE l.organization_id = ${organizationId}
          AND l.stage IN ('contacted', 'following-up')
          AND l.sequence_step >= 1
          AND NOT EXISTS (
            SELECT 1 FROM messages m
            WHERE m.lead_id = l.id AND m.status IN ('draft', 'edited')
          )
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getFactsForLead(
    leadId: string
  ): Promise<ReadonlyArray<PgSequenceFact>> {
    try {
      return await this.db<ReadonlyArray<PgSequenceFact>>`
        SELECT df.text, df.source_url
        FROM dossier_facts df
        JOIN dossiers d ON d.id = df.dossier_id
        WHERE d.lead_id = ${leadId}
        ORDER BY df.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLastSentMessageBody(leadId: string): Promise<string | null> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ body: string }>>>`
        SELECT body FROM messages
        WHERE lead_id = ${leadId} AND status = 'sent'
        ORDER BY sent_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX]?.body ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async createFollowUpDraft(
    input: CreateFollowUpDraftInput
  ): Promise<void> {
    try {
      await this.db`
        INSERT INTO messages (
          id, organization_id, lead_id, icp_id, channel, subject, body,
          status, origin, is_exploration, angle_type, length_bucket,
          cta_type, perso_depth
        )
        VALUES (
          ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.leadId},
          ${input.icpId}, ${input.channel}, ${input.subject}, ${input.body},
          'draft', 'auto', FALSE, 'follow_up', ${input.lengthBucket},
          ${input.ctaType}, ${input.persoDepth}
        )
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async setNextFollowUpAt(
    leadId: string,
    nextFollowUpAt: Date | null
  ): Promise<void> {
    try {
      await this.db`
        UPDATE leads SET next_follow_up_at = ${nextFollowUpAt}, updated_at = NOW()
        WHERE id = ${leadId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async markFollowingUp(
    leadId: string,
    organizationId: string
  ): Promise<void> {
    try {
      await this.db`
        UPDATE leads
        SET stage = 'following-up', origin = 'auto', updated_at = NOW()
        WHERE id = ${leadId}
          AND organization_id = ${organizationId}
          AND stage = 'contacted'
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async markNotInterested(leadId: string): Promise<void> {
    try {
      await this.db`
        UPDATE leads
        SET stage = 'not-interested', next_follow_up_at = NULL, updated_at = NOW()
        WHERE id = ${leadId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
