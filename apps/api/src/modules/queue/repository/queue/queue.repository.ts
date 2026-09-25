import type { QueuePostgres } from "./queue.postgres.ts";
import type {
  ApplyEditInput,
  MarkSentAndAdvanceInput,
  PgQueueFact,
  PgQueueRow,
  PgQueueSenderCred,
  SkipDraftInput,
} from "./queue.entities.ts";

export class QueueRepository {
  constructor(private readonly queuePostgres: QueuePostgres) {}

  getQueueRowsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgQueueRow>> {
    return this.queuePostgres.getQueueRowsByOrganization(organizationId);
  }

  getOneQueueRowByLead(leadId: string): Promise<PgQueueRow | null> {
    return this.queuePostgres.getOneQueueRowByLead(leadId);
  }

  isAutopilotEnabled(organizationId: string): Promise<boolean> {
    return this.queuePostgres.isAutopilotEnabled(organizationId);
  }

  getFactsForLeads(
    leadIds: ReadonlyArray<string>
  ): Promise<ReadonlyArray<PgQueueFact>> {
    return this.queuePostgres.getFactsForLeads(leadIds);
  }

  applyEdit(input: ApplyEditInput): Promise<void> {
    return this.queuePostgres.applyEdit(input);
  }

  getFirstActiveSenderByOrganization(
    organizationId: string
  ): Promise<PgQueueSenderCred | null> {
    return this.queuePostgres.getFirstActiveSenderByOrganization(
      organizationId
    );
  }

  getActiveSenderById(
    organizationId: string,
    senderId: string
  ): Promise<PgQueueSenderCred | null> {
    return this.queuePostgres.getActiveSenderById(organizationId, senderId);
  }

  getLastActiveSenderForLead(
    organizationId: string,
    leadId: string
  ): Promise<PgQueueSenderCred | null> {
    return this.queuePostgres.getLastActiveSenderForLead(organizationId, leadId);
  }

  getThreadMessageIds(
    organizationId: string,
    leadId: string
  ): Promise<ReadonlyArray<string>> {
    return this.queuePostgres.getThreadMessageIds(organizationId, leadId);
  }

  claimDraft(organizationId: string, messageId: string): Promise<boolean> {
    return this.queuePostgres.claimDraft(organizationId, messageId);
  }

  releaseDraft(organizationId: string, messageId: string): Promise<void> {
    return this.queuePostgres.releaseDraft(organizationId, messageId);
  }

  markSentAndAdvance(input: MarkSentAndAdvanceInput): Promise<void> {
    return this.queuePostgres.markSentAndAdvance(input);
  }

  skipDraft(input: SkipDraftInput): Promise<boolean> {
    return this.queuePostgres.skipDraft(input);
  }
}
