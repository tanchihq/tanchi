import {
  getBillingAccess,
  getRemainingMonthlyLeads,
  incrementMonthlyUsage,
} from "@shared/billing";
import type { LlmProvider } from "@shared/llm";
import { agentModel } from "@shared/llm";
import type { SourcingProvider } from "@shared/sourcing";
import type { EngineRepository } from "../../repository/engine/engine.repository.ts";
import type { PgEngineIcp } from "../../repository/engine/engine.entities.ts";
import type { EngineOffer } from "../../engine.types.ts";
import type { DiscoveryOutput } from "./chasseur.schemas.ts";
import { AiEnrichmentSchema, DiscoveryOutputSchema } from "./chasseur.schemas.ts";
import { extractJson, normalizeDomain } from "../../engine.utils.ts";
import { todayLabel } from "@shared/utils";
import {
  buildDiscoveryPrompt,
  buildEnrichmentPrompt,
} from "./chasseur.prompt.ts";
import { buildWinningProfileBrief } from "./chasseur.utils.ts";
import {
  CHASSEUR_LEARNING_WINDOW_DAYS,
  COMPANIES_PER_ICP,
  HUNTER_MIN_CONFIDENCE,
  MAX_LEADS_PER_COMPANY,
} from "../../engine.constants.ts";

type DiscoveredCompany = DiscoveryOutput["companies"][number];

type Contact = Readonly<{
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  email: string | null;
  emailStatus: "verified" | "guessed" | "none";
  linkedinUrl: string | null;
  instagramUrl: string | null;
  phone: string | null;
  channel: string;
  provider: string;
}>;

function aiContactToContact(
  raw: Readonly<{
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    email: string | null;
    linkedinUrl: string | null;
    instagramUrl: string | null;
    phone: string | null;
  }>
): Contact | null {
  const channel =
    raw.email !== null
      ? "email"
      : raw.linkedinUrl !== null
        ? "linkedin"
        : raw.phone !== null
          ? "call"
          : raw.instagramUrl !== null
            ? "instagram"
            : null;
  if (channel === null) return null;
  return {
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    email: raw.email,
    emailStatus: raw.email === null ? "none" : "guessed",
    linkedinUrl: raw.linkedinUrl,
    instagramUrl: raw.instagramUrl,
    phone: raw.phone,
    channel,
    provider: "ai",
  };
}

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
      console.log(
        "[engine:chasseur] no enrichment provider, using AI enrichment fallback"
      );
    }

    const [companyDomains, excludedDomains, leadEmails, excludedEmails] =
      await Promise.all([
        this.engineRepository.getExistingCompanyDomains(organizationId),
        this.engineRepository.getExcludedCompanyDomains(organizationId),
        this.engineRepository.getExistingLeadEmails(organizationId),
        this.engineRepository.getExcludedEmails(organizationId),
      ]);
    const existingDomains = new Set(
      [...companyDomains, ...excludedDomains].map((domain) =>
        domain.toLowerCase()
      )
    );
    const existingEmails = new Set(
      [...leadEmails, ...excludedEmails].map((email) => email.toLowerCase())
    );

    const [leadsPerDay, access] = await Promise.all([
      this.engineRepository.getLeadsPerDay(organizationId),
      getBillingAccess(organizationId),
    ]);
    const remainingMonthlyLeads = await getRemainingMonthlyLeads(
      organizationId,
      access.entitlements
    );
    const budget = Math.min(leadsPerDay, remainingMonthlyLeads);
    if (budget <= 0) {
      console.log(
        `[engine:chasseur] monthly lead quota reached orgId=${organizationId}, sourcing skipped`
      );
      return 0;
    }
    let created = 0;
    for (const icp of icps) {
      if (created >= budget) break;
      created += await this.sourceForIcp(
        organizationId,
        icp,
        offer,
        existingDomains,
        existingEmails,
        budget - created
      );
    }
    await incrementMonthlyUsage(organizationId, "leads", created);
    return created;
  }

  private async sourceForIcp(
    organizationId: string,
    icp: PgEngineIcp,
    offer: EngineOffer,
    existingDomains: Set<string>,
    existingEmails: Set<string>,
    budget: number
  ): Promise<number> {
    const conversion =
      await this.engineRepository.getProfileConversionForIcp(
        organizationId,
        icp.id,
        CHASSEUR_LEARNING_WINDOW_DAYS
      );
    const winningProfile = buildWinningProfileBrief(conversion);
    const companies = await this.discoverCompanies(icp, offer, winningProfile);
    let created = 0;
    for (const company of companies) {
      if (created >= budget) break;
      const domain = normalizeDomain(company.domain);
      if (domain === "" || existingDomains.has(domain)) continue;
      existingDomains.add(domain);
      created += await this.createLeadsForCompany(
        organizationId,
        icp.id,
        company,
        domain,
        existingEmails,
        budget - created
      );
    }
    return created;
  }

  private async discoverCompanies(
    icp: PgEngineIcp,
    offer: EngineOffer,
    winningProfile: string
  ): Promise<ReadonlyArray<DiscoveredCompany>> {
    try {
      const raw = await this.llm.research({
        prompt: buildDiscoveryPrompt(
          icp,
          offer,
          COMPANIES_PER_ICP,
          todayLabel(),
          winningProfile
        ),
        model: agentModel("chasseur"),
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
    existingEmails: Set<string>,
    maxLeads: number
  ): Promise<number> {
    const cap = Math.min(MAX_LEADS_PER_COMPANY, maxLeads);
    const contacts = (await this.getContacts(company, domain, cap))
      .filter(
        (contact) =>
          contact.email === null ||
          !existingEmails.has(contact.email.toLowerCase())
      )
      .slice(0, cap);
    if (contacts.length === 0) return 0;

    const companyId = await this.engineRepository.createOneCompany({
      organizationId,
      name: company.name,
      domain,
      website: `https://${domain}`,
      sector: company.sector,
      size: company.size,
      hq: company.hq,
    });

    let created = 0;
    for (const contact of contacts) {
      if (contact.email !== null) {
        existingEmails.add(contact.email.toLowerCase());
      }
      await this.engineRepository.createOneLead({
        organizationId,
        companyId,
        icpId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        role: contact.role,
        email: contact.email,
        emailStatus: contact.emailStatus,
        linkedinUrl: contact.linkedinUrl,
        instagramUrl: contact.instagramUrl,
        phone: contact.phone,
        channel: contact.channel,
        sourceProvider: contact.provider,
      });
      created += 1;
    }
    return created;
  }

  private async getContacts(
    company: DiscoveredCompany,
    domain: string,
    cap: number
  ): Promise<ReadonlyArray<Contact>> {
    const sourcing = this.sourcing;
    if (sourcing !== null) {
      const emails = await this.tryEnrich(sourcing, domain);
      return emails
        .filter((email) => (email.confidence ?? 0) >= HUNTER_MIN_CONFIDENCE)
        .map((email) => ({
          firstName: email.firstName,
          lastName: email.lastName,
          role: email.role,
          email: email.email,
          emailStatus: "verified" as const,
          linkedinUrl: null,
          instagramUrl: null,
          phone: null,
          channel: "email",
          provider: sourcing.name,
        }));
    }
    return this.enrichWithAi(company, domain, cap);
  }

  private async enrichWithAi(
    company: DiscoveredCompany,
    domain: string,
    cap: number
  ): Promise<ReadonlyArray<Contact>> {
    try {
      const raw = await this.llm.research({
        prompt: buildEnrichmentPrompt(company, domain, cap, todayLabel()),
        model: agentModel("chasseur"),
      });
      const parsed = AiEnrichmentSchema.parse(extractJson(raw));
      return parsed.contacts
        .map((contact) =>
          aiContactToContact({
            firstName: contact.firstName,
            lastName: contact.lastName,
            role: contact.role,
            email: contact.email,
            linkedinUrl: contact.linkedinUrl,
            instagramUrl: contact.instagramUrl,
            phone: contact.phone,
          })
        )
        .filter((contact): contact is Contact => contact !== null);
    } catch (error) {
      console.error(
        `[engine:chasseur] AI enrichment failed domain=${domain}: ${errorMessage(error)}`
      );
      return [];
    }
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
