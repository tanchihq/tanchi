import type { ProspectsPostgres } from "./prospects.postgres.ts";
import type {
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

export class ProspectsRepository {
  constructor(private readonly prospectsPostgres: ProspectsPostgres) {}

  getManyLeadsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgLeadListRow>> {
    return this.prospectsPostgres.getManyLeadsByOrganization(organizationId);
  }

  getOneLeadById(id: string): Promise<PgLeadRow | null> {
    return this.prospectsPostgres.getOneLeadById(id);
  }

  updateOneLeadStage(
    id: string,
    stage: PgStage,
    origin: "auto" | "manual"
  ): Promise<void> {
    return this.prospectsPostgres.updateOneLeadStage(id, stage, origin);
  }

  getDossierByLead(leadId: string): Promise<PgProspectDossier | null> {
    return this.prospectsPostgres.getDossierByLead(leadId);
  }

  getFactsByDossier(
    dossierId: string
  ): Promise<ReadonlyArray<PgProspectFact>> {
    return this.prospectsPostgres.getFactsByDossier(dossierId);
  }

  getAnglesByDossier(
    dossierId: string
  ): Promise<ReadonlyArray<PgProspectAngle>> {
    return this.prospectsPostgres.getAnglesByDossier(dossierId);
  }

  getMessagesByLead(
    leadId: string
  ): Promise<ReadonlyArray<PgProspectMessage>> {
    return this.prospectsPostgres.getMessagesByLead(leadId);
  }

  getOutcomesByLead(
    leadId: string
  ): Promise<ReadonlyArray<PgProspectOutcome>> {
    return this.prospectsPostgres.getOutcomesByLead(leadId);
  }

  getFirstActiveSenderByOrganization(
    organizationId: string
  ): Promise<PgSenderCred | null> {
    return this.prospectsPostgres.getFirstActiveSenderByOrganization(
      organizationId
    );
  }

  getActiveSenderById(
    organizationId: string,
    senderId: string
  ): Promise<PgSenderCred | null> {
    return this.prospectsPostgres.getActiveSenderById(
      organizationId,
      senderId
    );
  }

  getLatestDraftMessageByLead(
    leadId: string
  ): Promise<PgDraftMessage | null> {
    return this.prospectsPostgres.getLatestDraftMessageByLead(leadId);
  }

  markMessageSentAndRecord(
    input: Readonly<{
      messageId: string;
      senderId: string;
      organizationId: string;
      leadId: string;
    }>
  ): Promise<void> {
    return this.prospectsPostgres.markMessageSentAndRecord(input);
  }
}
