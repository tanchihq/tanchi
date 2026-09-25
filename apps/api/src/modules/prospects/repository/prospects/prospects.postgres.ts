import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import { SEND_CLAIM_TTL_MINUTES } from "../../prospects.constants.ts";
import type {
  ExcludeProspectInput,
  MarkMessageSentInput,
  PgDraftMessage,
  PgLeadListRow,
  PgLeadRow,
  PgProspectAngle,
  PgProspectDossier,
  PgProspectFact,
  PgProspectMessage,
  PgProspectOutcome,
  PgSenderCred,
  PgStage,
} from "./prospects.entities.ts";

export class ProspectsPostgres {
  constructor(private readonly db: DbClient) {}

  async getManyLeadsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgLeadListRow>> {
    try {
      const result = await this.db<ReadonlyArray<PgLeadListRow>>`
        SELECT
          l.id, l.first_name, l.last_name, l.channel, l.hot, l.stage, l.origin,
          l.score, l.qualification, l.created_at, l.next_follow_up_at, l.snooze_until,
          c.name AS company_name,
          i.name AS icp_name,
          i.market_id AS market_id,
          m.name AS market_name
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN icp i ON i.id = l.icp_id
        LEFT JOIN market m ON m.id = i.market_id
        WHERE l.organization_id = ${organizationId}
          AND l.excluded_at IS NULL
        ORDER BY l.created_at DESC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOneLeadById(id: string): Promise<PgLeadRow | null> {
    try {
      const result = await this.db<ReadonlyArray<PgLeadRow>>`
        SELECT
          l.id, l.organization_id, l.first_name, l.last_name, l.role, l.channel,
          l.hot, l.stage, l.origin, l.email, l.email_status, l.phone,
          l.linkedin_url, l.instagram_url, l.score, l.qualification,
          l.sequence_step,
          l.created_at, l.next_follow_up_at, l.snooze_until,
          l.company_id,
          c.name AS company_name,
          c.sector AS company_sector,
          c.size AS company_size,
          c.hq AS company_hq,
          c.website AS company_website,
          c.domain AS company_domain,
          i.name AS icp_name,
          i.market_id AS market_id,
          m.name AS market_name
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN icp i ON i.id = l.icp_id
        LEFT JOIN market m ON m.id = i.market_id
        WHERE l.id = ${id}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async updateOneLeadStage(
    id: string,
    stage: PgStage,
    origin: "auto" | "manual",
    organizationId: string
  ): Promise<void> {
    try {
      await this.db`
        UPDATE leads
        SET stage = ${stage}, origin = ${origin}, updated_at = NOW()
        WHERE id = ${id}
          AND organization_id = ${organizationId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async excludeProspect(input: ExcludeProspectInput): Promise<void> {
    try {
      await this.db.begin(async (tx) => {
        if (input.scope === "person") {
          if (input.email !== null) {
            await tx`
              INSERT INTO exclusions (id, organization_id, scope, email, reason)
              VALUES (
                ${Bun.randomUUIDv7()}, ${input.organizationId}, 'person',
                ${input.email.toLowerCase()}, ${input.reason}
              )
              ON CONFLICT (organization_id, email) WHERE scope = 'person'
              DO UPDATE SET reason = COALESCE(EXCLUDED.reason, exclusions.reason)
            `;
          }
          await tx`
            UPDATE leads SET excluded_at = NOW(), updated_at = NOW()
            WHERE id = ${input.leadId}
              AND organization_id = ${input.organizationId}
          `;
          return;
        }

        if (input.companyDomain !== null) {
          await tx`
            INSERT INTO exclusions (id, organization_id, scope, company_domain, reason)
            VALUES (
              ${Bun.randomUUIDv7()}, ${input.organizationId}, 'company',
              ${input.companyDomain.toLowerCase()}, ${input.reason}
            )
            ON CONFLICT (organization_id, company_domain) WHERE scope = 'company'
            DO UPDATE SET reason = COALESCE(EXCLUDED.reason, exclusions.reason)
          `;
        }
        if (input.companyId === null) {
          await tx`
            UPDATE leads SET excluded_at = NOW(), updated_at = NOW()
            WHERE id = ${input.leadId}
              AND organization_id = ${input.organizationId}
          `;
          return;
        }
        await tx`
          UPDATE leads SET excluded_at = NOW(), updated_at = NOW()
          WHERE organization_id = ${input.organizationId}
            AND company_id = ${input.companyId}
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getDossierByLead(leadId: string): Promise<PgProspectDossier | null> {
    try {
      const result = await this.db<ReadonlyArray<PgProspectDossier>>`
        SELECT id, summary FROM dossiers WHERE lead_id = ${leadId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getFactsByDossier(
    dossierId: string
  ): Promise<ReadonlyArray<PgProspectFact>> {
    try {
      const result = await this.db<ReadonlyArray<PgProspectFact>>`
        SELECT text, source_url FROM dossier_facts
        WHERE dossier_id = ${dossierId}
        ORDER BY created_at ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getAnglesByDossier(
    dossierId: string
  ): Promise<ReadonlyArray<PgProspectAngle>> {
    try {
      const result = await this.db<ReadonlyArray<PgProspectAngle>>`
        SELECT rank, title, note, angle_type, chosen FROM dossier_angles
        WHERE dossier_id = ${dossierId}
        ORDER BY rank ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getMessagesByLead(
    leadId: string
  ): Promise<ReadonlyArray<PgProspectMessage>> {
    try {
      const result = await this.db<ReadonlyArray<PgProspectMessage>>`
        SELECT id, channel, subject, body, status, sent_at, sent_automatically,
               created_at
        FROM messages
        WHERE lead_id = ${leadId}
        ORDER BY created_at ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOutcomesByLead(
    leadId: string
  ): Promise<ReadonlyArray<PgProspectOutcome>> {
    try {
      const result = await this.db<ReadonlyArray<PgProspectOutcome>>`
        SELECT stage_signal, classification, reply_text, reply_from, created_at
        FROM outcomes
        WHERE lead_id = ${leadId}
        ORDER BY created_at ASC
      `;
      return result;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getFirstActiveSenderByOrganization(
    organizationId: string
  ): Promise<PgSenderCred | null> {
    try {
      const result = await this.db<ReadonlyArray<PgSenderCred>>`
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
  ): Promise<PgSenderCred | null> {
    try {
      const result = await this.db<ReadonlyArray<PgSenderCred>>`
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

  async getLatestDraftMessageByLead(
    leadId: string
  ): Promise<PgDraftMessage | null> {
    try {
      const result = await this.db<ReadonlyArray<PgDraftMessage>>`
        SELECT id, subject, body FROM messages
        WHERE lead_id = ${leadId} AND status IN ('draft', 'edited')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLastActiveSenderForLead(
    organizationId: string,
    leadId: string
  ): Promise<PgSenderCred | null> {
    try {
      const result = await this.db<ReadonlyArray<PgSenderCred>>`
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

  async markMessageSentAndRecord(input: MarkMessageSentInput): Promise<void> {
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
          SET sequence_step = sequence_step + 1, next_follow_up_at = NULL,
              updated_at = NOW()
          WHERE id = ${input.leadId}
            AND organization_id = ${input.organizationId}
        `;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
