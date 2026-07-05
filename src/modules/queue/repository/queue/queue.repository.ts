import type { QueuePostgres } from "./queue.postgres.ts";
import type {
  ApplyEditInput,
  MarkSentAndAdvanceInput,
  PgQueueFact,
  PgQueueRow,
  PgQueueSenderCred,
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

  markSentAndAdvance(input: MarkSentAndAdvanceInput): Promise<void> {
    return this.queuePostgres.markSentAndAdvance(input);
  }
}
