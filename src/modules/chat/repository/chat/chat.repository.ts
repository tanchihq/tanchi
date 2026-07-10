import type { ChatPostgres } from "./chat.postgres.ts";
import type {
  InsertMessageInput,
  PgAttachedLead,
  PgChatMessage,
  PgConversation,
  PgLeadContext,
} from "./chat.entities.ts";

export class ChatRepository {
  constructor(private readonly chatPostgres: ChatPostgres) {}

  createConversation(
    organizationId: string,
    title: string
  ): Promise<PgConversation> {
    return this.chatPostgres.createConversation(organizationId, title);
  }

  getConversationsByOrganization(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgConversation>> {
    return this.chatPostgres.getConversationsByOrganization(
      organizationId,
      limit
    );
  }

  getConversationById(id: string): Promise<PgConversation | null> {
    return this.chatPostgres.getConversationById(id);
  }

  getMessagesByConversation(
    conversationId: string
  ): Promise<ReadonlyArray<PgChatMessage>> {
    return this.chatPostgres.getMessagesByConversation(conversationId);
  }

  insertMessage(input: InsertMessageInput): Promise<PgChatMessage> {
    return this.chatPostgres.insertMessage(input);
  }

  touchConversation(id: string): Promise<void> {
    return this.chatPostgres.touchConversation(id);
  }

  setConversationTitle(id: string, title: string): Promise<void> {
    return this.chatPostgres.setConversationTitle(id, title);
  }

  deleteConversation(organizationId: string, id: string): Promise<void> {
    return this.chatPostgres.deleteConversation(organizationId, id);
  }

  getAttachedLeads(
    conversationId: string
  ): Promise<ReadonlyArray<PgAttachedLead>> {
    return this.chatPostgres.getAttachedLeads(conversationId);
  }

  getLeadForOrganization(
    leadId: string,
    organizationId: string
  ): Promise<PgAttachedLead | null> {
    return this.chatPostgres.getLeadForOrganization(leadId, organizationId);
  }

  attachLead(conversationId: string, leadId: string): Promise<void> {
    return this.chatPostgres.attachLead(conversationId, leadId);
  }

  detachLead(conversationId: string, leadId: string): Promise<void> {
    return this.chatPostgres.detachLead(conversationId, leadId);
  }

  getLeadContextsForConversation(
    conversationId: string
  ): Promise<ReadonlyArray<PgLeadContext>> {
    return this.chatPostgres.getLeadContextsForConversation(conversationId);
  }
}
