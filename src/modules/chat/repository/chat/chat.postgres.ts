import type { DbClient } from "@shared/db";
import { ARRAY, throwSanitizeError } from "@shared/utils";
import type {
  InsertMessageInput,
  PgAttachedLead,
  PgChatMessage,
  PgConversation,
  PgLeadContext,
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
