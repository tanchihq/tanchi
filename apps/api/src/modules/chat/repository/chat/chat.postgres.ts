import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  CreateManualLeadInput,
  InsertMessageInput,
  PgAttachedLead,
  PgChatMessage,
  PgConversation,
  PgCreatedLead,
  PgIcpOption,
  PgLeadContext,
  PgLeadDetail,
  PgLeadFact,
  RecordSentMessageInput,
  SaveDraftInput,
  UpdateLeadInput,
} from "./chat.entities.ts";

export class ChatPostgres {
  constructor(private readonly db: DbClient) {}

  async createConversation(
    organizationId: string,
    title: string
  ): Promise<PgConversation> {
    try {
      const result = await this.db<ReadonlyArray<PgConversation>>`
        INSERT INTO chat_conversations (id, organization_id, title)
        VALUES (${Bun.randomUUIDv7()}, ${organizationId}, ${title})
        RETURNING id, organization_id, title, created_at, updated_at
      `;
      return result[ARRAY.FIRST_INDEX] as PgConversation;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getConversationsByOrganization(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgConversation>> {
    try {
      return await this.db<ReadonlyArray<PgConversation>>`
        SELECT id, organization_id, title, created_at, updated_at
        FROM chat_conversations
        WHERE organization_id = ${organizationId}
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getConversationById(id: string): Promise<PgConversation | null> {
    try {
      const result = await this.db<ReadonlyArray<PgConversation>>`
        SELECT id, organization_id, title, created_at, updated_at
        FROM chat_conversations WHERE id = ${id}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getMessagesByConversation(
    conversationId: string
  ): Promise<ReadonlyArray<PgChatMessage>> {
    try {
      return await this.db<ReadonlyArray<PgChatMessage>>`
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE conversation_id = ${conversationId}
        ORDER BY created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async insertMessage(input: InsertMessageInput): Promise<PgChatMessage> {
    try {
      const result = await this.db<ReadonlyArray<PgChatMessage>>`
        INSERT INTO chat_messages (id, organization_id, conversation_id, role, content)
        VALUES (
          ${Bun.randomUUIDv7()}, ${input.organizationId},
          ${input.conversationId}, ${input.role}, ${input.content}
        )
        RETURNING id, role, content, created_at
      `;
      return result[ARRAY.FIRST_INDEX] as PgChatMessage;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async touchConversation(id: string): Promise<void> {
    try {
      await this.db`
        UPDATE chat_conversations SET updated_at = NOW() WHERE id = ${id}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async setConversationTitle(id: string, title: string): Promise<void> {
    try {
      await this.db`
        UPDATE chat_conversations SET title = ${title}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async deleteConversation(
    organizationId: string,
    id: string
  ): Promise<void> {
    try {
      await this.db`
        DELETE FROM chat_conversations
        WHERE id = ${id} AND organization_id = ${organizationId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getAttachedLeads(
    conversationId: string
  ): Promise<ReadonlyArray<PgAttachedLead>> {
    try {
      return await this.db<ReadonlyArray<PgAttachedLead>>`
        SELECT
          l.id AS lead_id, l.first_name, l.last_name, l.stage,
          c.name AS company_name
        FROM chat_conversation_leads cl
        JOIN leads l ON l.id = cl.lead_id
        LEFT JOIN companies c ON c.id = l.company_id
        WHERE cl.conversation_id = ${conversationId}
        ORDER BY cl.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadForOrganization(
    leadId: string,
    organizationId: string
  ): Promise<PgAttachedLead | null> {
    try {
      const result = await this.db<ReadonlyArray<PgAttachedLead>>`
        SELECT
          l.id AS lead_id, l.first_name, l.last_name, l.stage,
          c.name AS company_name
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        WHERE l.id = ${leadId} AND l.organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async attachLead(conversationId: string, leadId: string): Promise<void> {
    try {
      await this.db`
        INSERT INTO chat_conversation_leads (conversation_id, lead_id)
        VALUES (${conversationId}, ${leadId})
        ON CONFLICT (conversation_id, lead_id) DO NOTHING
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async detachLead(conversationId: string, leadId: string): Promise<void> {
    try {
      await this.db`
        DELETE FROM chat_conversation_leads
        WHERE conversation_id = ${conversationId} AND lead_id = ${leadId}
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async createManualLead(
    input: CreateManualLeadInput
  ): Promise<PgCreatedLead> {
    try {
      return await this.db.begin(async (tx) => {
        const companyId = Bun.randomUUIDv7();
        await tx`
          INSERT INTO companies (id, organization_id, name, domain, website)
          VALUES (
            ${companyId}, ${input.organizationId}, ${input.companyName},
            ${input.companyDomain},
            ${input.companyDomain === null ? null : `https://${input.companyDomain}`}
          )
        `;
        const leadId = Bun.randomUUIDv7();
        const emailStatus = input.email === null ? "none" : "guessed";
        const result = await tx<ReadonlyArray<PgCreatedLead>>`
          INSERT INTO leads (
            id, organization_id, company_id, icp_id, first_name, last_name, role,
            email, email_status, linkedin_url, channel, stage, origin,
            source_provider
          )
          VALUES (
            ${leadId}, ${input.organizationId}, ${companyId}, ${input.icpId},
            ${input.firstName}, ${input.lastName}, ${input.role}, ${input.email},
            ${emailStatus}, ${input.linkedinUrl}, 'email', 'identified', 'manual',
            'chat'
          )
          RETURNING id AS lead_id, first_name, last_name,
            ${input.companyName}::text AS company_name
        `;
        return result[ARRAY.FIRST_INDEX] as PgCreatedLead;
      });
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadDetailForOrganization(
    leadId: string,
    organizationId: string
  ): Promise<PgLeadDetail | null> {
    try {
      const result = await this.db<ReadonlyArray<PgLeadDetail>>`
        SELECT
          l.id, l.icp_id, l.first_name, l.last_name, l.role, l.email,
          c.name AS company_name, c.domain AS company_domain,
          c.sector AS company_sector, c.size AS company_size,
          d.summary,
          draft.subject AS draft_subject, draft.body AS draft_body
        FROM leads l
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN dossiers d ON d.lead_id = l.id
        LEFT JOIN LATERAL (
          SELECT subject, body FROM messages
          WHERE lead_id = l.id AND status IN ('draft','edited','sent')
          ORDER BY created_at DESC LIMIT 1
        ) draft ON TRUE
        WHERE l.id = ${leadId} AND l.organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX] ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getIcpsForOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgIcpOption>> {
    try {
      return await this.db<ReadonlyArray<PgIcpOption>>`
        SELECT id, name FROM icp
        WHERE organization_id = ${organizationId}
        ORDER BY position ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async assignLeadIcp(
    leadId: string,
    organizationId: string,
    icpId: string
  ): Promise<boolean> {
    try {
      const result = await this.db`
        UPDATE leads SET icp_id = ${icpId}, updated_at = NOW()
        WHERE id = ${leadId} AND organization_id = ${organizationId}
      `;
      return (result.count ?? 0) > 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async updateLead(input: UpdateLeadInput): Promise<boolean> {
    try {
      const result = await this.db`
        UPDATE leads SET
          first_name = COALESCE(${input.firstName}::text, first_name),
          last_name = COALESCE(${input.lastName}::text, last_name),
          role = COALESCE(${input.role}::text, role),
          email = COALESCE(${input.email}::text, email),
          email_status = COALESCE(${input.emailStatus}::text, email_status),
          phone = COALESCE(${input.phone}::text, phone),
          linkedin_url = COALESCE(${input.linkedinUrl}::text, linkedin_url),
          instagram_url = COALESCE(${input.instagramUrl}::text, instagram_url),
          channel = COALESCE(${input.channel}::text, channel),
          updated_at = NOW()
        WHERE id = ${input.leadId}
          AND organization_id = ${input.organizationId}
      `;
      return (result.count ?? 0) > 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async leadHasSentMessage(leadId: string): Promise<boolean> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ exists: boolean }>>>`
        SELECT EXISTS(
          SELECT 1 FROM messages
          WHERE lead_id = ${leadId} AND status = 'sent'
        ) AS exists
      `;
      return result[ARRAY.FIRST_INDEX]?.exists ?? false;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async recordSentMessage(input: RecordSentMessageInput): Promise<void> {
    try {
      await this.db`
        INSERT INTO messages (
          id, organization_id, lead_id, icp_id, channel, subject, body,
          status, origin, sent_at
        )
        VALUES (
          ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.leadId},
          ${input.icpId}, 'email', ${input.subject}, ${input.body},
          'sent', 'manual', ${input.sentAt}
        )
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async armFollowUpSequence(
    leadId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      const result = await this.db`
        UPDATE leads
        SET stage = 'following-up',
            sequence_step = GREATEST(sequence_step, 1),
            next_follow_up_at = NULL,
            updated_at = NOW()
        WHERE id = ${leadId} AND organization_id = ${organizationId}
      `;
      return (result.count ?? 0) > 0;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getOutreachLanguage(organizationId: string): Promise<string | null> {
    try {
      const result = await this.db<ReadonlyArray<Readonly<{ outreach_language: string }>>>`
        SELECT outreach_language FROM organization_profile
        WHERE organization_id = ${organizationId}
      `;
      return result[ARRAY.FIRST_INDEX]?.outreach_language ?? null;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getFactsForLead(
    leadId: string
  ): Promise<ReadonlyArray<PgLeadFact>> {
    try {
      return await this.db<ReadonlyArray<PgLeadFact>>`
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

  async saveDraftForLead(input: SaveDraftInput): Promise<void> {
    try {
      await this.db`
        INSERT INTO messages (
          id, organization_id, lead_id, icp_id, channel, subject, body,
          status, origin, angle_type_inferred, length_bucket
        )
        VALUES (
          ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.leadId},
          ${input.icpId}, 'email', ${input.subject}, ${input.body},
          'draft', 'manual', ${input.angleTypeInferred}, ${input.lengthBucket}
        )
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }

  async getLeadContextsForConversation(
    conversationId: string
  ): Promise<ReadonlyArray<PgLeadContext>> {
    try {
      return await this.db<ReadonlyArray<PgLeadContext>>`
        SELECT
          l.id AS lead_id, l.first_name, l.last_name, l.role,
          c.name AS company_name, c.sector AS company_sector, c.size AS company_size,
          d.summary,
          draft.subject AS draft_subject, draft.body AS draft_body
        FROM chat_conversation_leads cl
        JOIN leads l ON l.id = cl.lead_id
        LEFT JOIN companies c ON c.id = l.company_id
        LEFT JOIN dossiers d ON d.lead_id = l.id
        LEFT JOIN LATERAL (
          SELECT subject, body FROM messages
          WHERE lead_id = l.id AND status IN ('draft','edited','sent')
          ORDER BY created_at DESC LIMIT 1
        ) draft ON TRUE
        WHERE cl.conversation_id = ${conversationId}
        ORDER BY cl.created_at ASC
      `;
    } catch (error) {
      return throwSanitizeError(error);
    }
  }
}
