import type { ChatPostgres } from "./chat.postgres.ts";
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

  createManualLead(input: CreateManualLeadInput): Promise<PgCreatedLead> {
    return this.chatPostgres.createManualLead(input);
  }

  getLeadDetailForOrganization(
    leadId: string,
    organizationId: string
  ): Promise<PgLeadDetail | null> {
    return this.chatPostgres.getLeadDetailForOrganization(
      leadId,
      organizationId
    );
  }

  getIcpsForOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgIcpOption>> {
    return this.chatPostgres.getIcpsForOrganization(organizationId);
  }

  assignLeadIcp(
    leadId: string,
    organizationId: string,
    icpId: string
  ): Promise<boolean> {
    return this.chatPostgres.assignLeadIcp(leadId, organizationId, icpId);
  }

  getOutreachLanguage(organizationId: string): Promise<string | null> {
    return this.chatPostgres.getOutreachLanguage(organizationId);
  }

  getFactsForLead(leadId: string): Promise<ReadonlyArray<PgLeadFact>> {
    return this.chatPostgres.getFactsForLead(leadId);
  }

  saveDraftForLead(input: SaveDraftInput): Promise<void> {
    return this.chatPostgres.saveDraftForLead(input);
  }

  updateLead(input: UpdateLeadInput): Promise<boolean> {
    return this.chatPostgres.updateLead(input);
  }

  leadHasSentMessage(leadId: string): Promise<boolean> {
    return this.chatPostgres.leadHasSentMessage(leadId);
  }

  recordSentMessage(input: RecordSentMessageInput): Promise<void> {
    return this.chatPostgres.recordSentMessage(input);
  }

  armFollowUpSequence(
    leadId: string,
    organizationId: string
  ): Promise<boolean> {
    return this.chatPostgres.armFollowUpSequence(leadId, organizationId);
  }
}
