import type { EnginePostgres } from "./engine.postgres.ts";
import type {
  CreateCompanyInput,
  CreateLeadInput,
  CreateMessageDraftInput,
  PersistProfileInput,
  PgCopyAngle,
  PgCopyFact,
  PgEngineIcp,
  PgEngineLead,
  PgIcpEdit,
  PgMessageOutcomeRow,
  PgProfileConversionRow,
  PgEngineProfile,
  PgEngineRun,
} from "./engine.entities.ts";

export type EngineRun = Readonly<{
  id: string;
  organizationId: string;
  status: string;
  sourced: boolean;
  sourcedCount: number;
  profiledCount: number;
  draftedCount: number;
}>;

function toEngineRun(run: PgEngineRun): EngineRun {
  return {
    id: run.id,
    organizationId: run.organization_id,
    status: run.status,
    sourced: run.sourced,
    sourcedCount: run.sourced_count,
    profiledCount: run.profiled_count,
    draftedCount: run.drafted_count,
  };
}

export class EngineRepository {
  constructor(private readonly enginePostgres: EnginePostgres) {}

  getExcludedWeekdays(organizationId: string): Promise<ReadonlyArray<number>> {
    return this.enginePostgres.getExcludedWeekdays(organizationId);
  }

  getAllOrganizationIds(): Promise<ReadonlyArray<string>> {
    return this.enginePostgres.getAllOrganizationIds();
  }

  getIcpsByOrganization(
    organizationId: string
  ): Promise<ReadonlyArray<PgEngineIcp>> {
    return this.enginePostgres.getIcpsByOrganization(organizationId);
  }

  getOrganizationProfile(
    organizationId: string
  ): Promise<PgEngineProfile | null> {
    return this.enginePostgres.getOrganizationProfile(organizationId);
  }

  getOrganizationName(organizationId: string): Promise<string | null> {
    return this.enginePostgres.getOrganizationName(organizationId);
  }

  async getOrganizationRecipient(
    organizationId: string
  ): Promise<
    Readonly<{ email: string; name: string; organizationName: string }> | null
  > {
    const recipient =
      await this.enginePostgres.getOrganizationRecipient(organizationId);
    if (recipient === null) return null;
    return {
      email: recipient.email,
      name: recipient.name ?? "",
      organizationName: recipient.organization_name,
    };
  }

  async getOrCreateActiveRun(organizationId: string): Promise<EngineRun> {
    const existing = await this.enginePostgres.getActiveRun(organizationId);
    if (existing !== null) return toEngineRun(existing);
    const inserted = await this.enginePostgres.insertRunIfNone(
      Bun.randomUUIDv7(),
      organizationId
    );
    if (inserted !== null) return toEngineRun(inserted);
    const active = await this.enginePostgres.getActiveRun(organizationId);
    if (active === null) {
      throw new Error("[engine] active run not found after insert conflict");
    }
    return toEngineRun(active);
  }

  markRunSourced(runId: string, sourcedCount: number): Promise<void> {
    return this.enginePostgres.markRunSourced(runId, sourcedCount);
  }

  addRunProgress(
    runId: string,
    profiledCount: number,
    draftedCount: number
  ): Promise<void> {
    return this.enginePostgres.addRunProgress(
      runId,
      profiledCount,
      draftedCount
    );
  }

  async completeRun(runId: string): Promise<EngineRun | null> {
    const completed = await this.enginePostgres.completeRun(runId);
    return completed === null ? null : toEngineRun(completed);
  }

  failRun(runId: string): Promise<void> {
    return this.enginePostgres.failRun(runId);
  }

  getOrganizationIdsWithUnfinishedRun(): Promise<ReadonlyArray<string>> {
    return this.enginePostgres.getOrganizationIdsWithUnfinishedRun();
  }

  getLatestPlaybook(
    organizationId: string,
    icpId: string
  ): Promise<string | null> {
    return this.enginePostgres.getLatestPlaybook(organizationId, icpId);
  }

  getExistingCompanyDomains(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    return this.enginePostgres.getExistingCompanyDomains(organizationId);
  }

  getExistingLeadEmails(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    return this.enginePostgres.getExistingLeadEmails(organizationId);
  }

  getExcludedEmails(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    return this.enginePostgres.getExcludedEmails(organizationId);
  }

  getExcludedCompanyDomains(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    return this.enginePostgres.getExcludedCompanyDomains(organizationId);
  }

  createOneCompany(input: CreateCompanyInput): Promise<string> {
    return this.enginePostgres.createOneCompany(input);
  }

  createOneLead(input: CreateLeadInput): Promise<string> {
    return this.enginePostgres.createOneLead(input);
  }

  getLeadsNeedingProfile(
    organizationId: string
  ): Promise<ReadonlyArray<PgEngineLead>> {
    return this.enginePostgres.getLeadsNeedingProfile(organizationId);
  }

  getLeadsNeedingCopy(
    organizationId: string
  ): Promise<ReadonlyArray<PgEngineLead>> {
    return this.enginePostgres.getLeadsNeedingCopy(organizationId);
  }

  persistProfile(input: PersistProfileInput): Promise<void> {
    return this.enginePostgres.persistProfile(input);
  }

  getDossierSummaryForLead(leadId: string): Promise<string | null> {
    return this.enginePostgres.getDossierSummaryForLead(leadId);
  }

  getFactsForLead(leadId: string): Promise<ReadonlyArray<PgCopyFact>> {
    return this.enginePostgres.getFactsForLead(leadId);
  }

  getChosenAngleForLead(leadId: string): Promise<PgCopyAngle | null> {
    return this.enginePostgres.getChosenAngleForLead(leadId);
  }

  createOneMessageDraft(input: CreateMessageDraftInput): Promise<void> {
    return this.enginePostgres.createOneMessageDraft(input);
  }

  getSentMessageOutcomesForIcp(
    organizationId: string,
    icpId: string,
    sinceDays: number
  ): Promise<ReadonlyArray<PgMessageOutcomeRow>> {
    return this.enginePostgres.getSentMessageOutcomesForIcp(
      organizationId,
      icpId,
      sinceDays
    );
  }

  getProfileConversionForIcp(
    organizationId: string,
    icpId: string,
    sinceDays: number
  ): Promise<ReadonlyArray<PgProfileConversionRow>> {
    return this.enginePostgres.getProfileConversionForIcp(
      organizationId,
      icpId,
      sinceDays
    );
  }

  getRecentEditsForIcp(
    organizationId: string,
    icpId: string,
    limit: number
  ): Promise<ReadonlyArray<PgIcpEdit>> {
    return this.enginePostgres.getRecentEditsForIcp(
      organizationId,
      icpId,
      limit
    );
  }

  insertPlaybook(
    organizationId: string,
    icpId: string,
    content: string
  ): Promise<void> {
    return this.enginePostgres.insertPlaybook(organizationId, icpId, content);
  }
}
