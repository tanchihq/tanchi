import type { LlmProvider } from "@shared/llm";
import type { SourcingProvider } from "@shared/sourcing";
import type { EngineRepository } from "../../repository/engine/engine.repository.ts";
import type { PgEngineIcp } from "../../repository/engine/engine.entities.ts";
import type { EngineOffer } from "../../engine.types.ts";
import type { DiscoveryOutput } from "./chasseur.schemas.ts";
import { DiscoveryOutputSchema } from "./chasseur.schemas.ts";
import { extractJson, normalizeDomain } from "../../engine.utils.ts";
import { buildDiscoveryPrompt } from "./chasseur.prompt.ts";
import {
  COMPANIES_PER_ICP,
  HUNTER_MIN_CONFIDENCE,
  MAX_LEADS_PER_COMPANY,
} from "../../engine.constants.ts";

type DiscoveredCompany = DiscoveryOutput["companies"][number];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class ChasseurService {
  constructor(
    private readonly engineRepository: EngineRepository,
    private readonly llm: LlmProvider,
    private readonly sourcing: SourcingProvider | null
  ) {}

  async source(
    organizationId: string,
    icps: ReadonlyArray<PgEngineIcp>,
    offer: EngineOffer
  ): Promise<number> {
    if (this.sourcing === null) {
      console.error(
        "[engine:chasseur] no sourcing provider configured, skipping sourcing"
      );
      return 0;
    }

    const existingDomains = new Set(
      await this.engineRepository.getExistingCompanyDomains(organizationId)
    );
    const [leadEmails, suppressedEmails] = await Promise.all([
      this.engineRepository.getExistingLeadEmails(organizationId),
      this.engineRepository.getSuppressedEmails(organizationId),
    ]);
    const existingEmails = new Set(
      [...leadEmails, ...suppressedEmails].map((email) => email.toLowerCase())
    );

    let created = 0;
    for (const icp of icps) {
      created += await this.sourceForIcp(
        organizationId,
        icp,
        offer,
        existingDomains,
        existingEmails
      );
    }
    return created;
  }

  private async sourceForIcp(
    organizationId: string,
    icp: PgEngineIcp,
    offer: EngineOffer,
    existingDomains: Set<string>,
    existingEmails: Set<string>
  ): Promise<number> {
    const companies = await this.discoverCompanies(icp, offer);
    let created = 0;
    for (const company of companies) {
      const domain = normalizeDomain(company.domain);
      if (domain === "" || existingDomains.has(domain)) continue;
      existingDomains.add(domain);
      created += await this.createLeadsForCompany(
        organizationId,
        icp.id,
        company,
        domain,
        existingEmails
      );
    }
    return created;
  }

  private async discoverCompanies(
    icp: PgEngineIcp,
    offer: EngineOffer
  ): Promise<ReadonlyArray<DiscoveredCompany>> {
    try {
      const raw = await this.llm.research({
        prompt: buildDiscoveryPrompt(icp, offer, COMPANIES_PER_ICP),
      });
      return DiscoveryOutputSchema.parse(extractJson(raw)).companies;
    } catch (error) {
      console.error(
        `[engine:chasseur] discovery failed icp=${icp.id}: ${errorMessage(error)}`
      );
      return [];
    }
  }

  private async createLeadsForCompany(
    organizationId: string,
    icpId: string,
    company: DiscoveredCompany,
    domain: string,
    existingEmails: Set<string>
  ): Promise<number> {
    const sourcing = this.sourcing;
    if (sourcing === null) return 0;

    const companyId = await this.engineRepository.createOneCompany({
      organizationId,
      name: company.name,
      domain,
      website: `https://${domain}`,
      sector: company.sector,
      size: company.size,
      hq: company.hq,
    });

    const emails = await this.tryEnrich(sourcing, domain);
    const usable = emails
      .filter((email) => (email.confidence ?? 0) >= HUNTER_MIN_CONFIDENCE)
      .filter((email) => !existingEmails.has(email.email.toLowerCase()))
      .slice(0, MAX_LEADS_PER_COMPANY);

    let created = 0;
    for (const email of usable) {
      existingEmails.add(email.email.toLowerCase());
      await this.engineRepository.createOneLead({
        organizationId,
        companyId,
        icpId,
        firstName: email.firstName,
        lastName: email.lastName,
        role: email.role,
        email: email.email,
        emailStatus: "verified",
        channel: "email",
        sourceProvider: sourcing.name,
      });
      created += 1;
    }
    return created;
  }

  private async tryEnrich(sourcing: SourcingProvider, domain: string) {
    try {
      return await sourcing.enrichDomain(domain);
    } catch (error) {
      console.error(
        `[engine:chasseur] enrichDomain failed domain=${domain}: ${errorMessage(error)}`
      );
      return [];
    }
  }
}
