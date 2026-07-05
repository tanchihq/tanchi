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
  PgEngineProfile,
} from "./engine.entities.ts";

export class EngineRepository {
  constructor(private readonly enginePostgres: EnginePostgres) {}

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

  getSuppressedEmails(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    return this.enginePostgres.getSuppressedEmails(organizationId);
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
}
