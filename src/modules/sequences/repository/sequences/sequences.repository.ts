import type { SequencesPostgres } from "./sequences.postgres.ts";
import type {
  CreateFollowUpDraftInput,
  PgDueLead,
  PgSequenceConfig,
  PgSequenceFact,
} from "./sequences.entities.ts";

export class SequencesRepository {
  constructor(private readonly sequencesPostgres: SequencesPostgres) {}

  getAllOrganizationIds(): Promise<ReadonlyArray<string>> {
    return this.sequencesPostgres.getAllOrganizationIds();
  }

  getSequenceConfig(
    organizationId: string
  ): Promise<PgSequenceConfig | null> {
    return this.sequencesPostgres.getSequenceConfig(organizationId);
  }

  getDueLeads(organizationId: string): Promise<ReadonlyArray<PgDueLead>> {
    return this.sequencesPostgres.getDueLeads(organizationId);
  }

  getFactsForLead(leadId: string): Promise<ReadonlyArray<PgSequenceFact>> {
    return this.sequencesPostgres.getFactsForLead(leadId);
  }

  getLastSentMessageBody(leadId: string): Promise<string | null> {
    return this.sequencesPostgres.getLastSentMessageBody(leadId);
  }

  createFollowUpDraft(input: CreateFollowUpDraftInput): Promise<void> {
    return this.sequencesPostgres.createFollowUpDraft(input);
  }

  setNextFollowUpAt(
    leadId: string,
    nextFollowUpAt: Date | null
  ): Promise<void> {
    return this.sequencesPostgres.setNextFollowUpAt(leadId, nextFollowUpAt);
  }

  markNotInterested(leadId: string): Promise<void> {
    return this.sequencesPostgres.markNotInterested(leadId);
  }
}
