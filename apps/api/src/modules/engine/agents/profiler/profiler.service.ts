import type { LlmProvider } from "@shared/llm";
import { agentModel } from "@shared/llm";
import { fetchPageText, hostOf, verifyQuote } from "@shared/web";
import type { EngineRepository } from "../../repository/engine/engine.repository.ts";
import type {
  PgEngineLead,
  ProfileAngleInput,
} from "../../repository/engine/engine.entities.ts";
import type { EngineOffer } from "../../engine.types.ts";
import type { ProfilerOutput } from "./profiler.schemas.ts";
import { ProfilerOutputSchema } from "./profiler.schemas.ts";
import { extractJson, normalizeDomain } from "../../engine.utils.ts";
import { todayLabel } from "@shared/utils";
import { PROFILER_FETCH_TIMEOUT_MS } from "../../engine.constants.ts";
import { buildProfilerPrompt } from "./profiler.prompt.ts";

const NO_FACTS_MAX_SCORE = 20;

type ProfilerFact = ProfilerOutput["facts"][number];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function onlyHost(url: string | null, domain: string): string | null {
  if (url === null) return null;
  const host = hostOf(url);
  if (host === null) return null;
  return host === domain || host.endsWith(`.${domain}`) ? url : null;
}

export class ProfilerService {
  constructor(
    private readonly engineRepository: EngineRepository,
    private readonly llm: LlmProvider
  ) {}

  async profile(lead: PgEngineLead, offer: EngineOffer): Promise<boolean> {
    const parsed = await this.runProfiler(lead, offer);
    if (parsed === null) return false;

    const companyHost =
      lead.company_domain === null
        ? null
        : normalizeDomain(lead.company_domain);
    const linkedinHost =
      lead.linkedin_url === null ? null : hostOf(lead.linkedin_url);

    const checks = await Promise.all(
      parsed.facts.map(async (fact, index) => ({
        index,
        fact,
        ok: await this.verifyFact(fact, companyHost, linkedinHost),
      }))
    );
    const survivors = checks.filter((check) => check.ok);
    const indexMap = new Map(
      survivors.map((check, newIndex) => [check.index, newIndex])
    );

    const facts = survivors.map((check) => ({
      text: check.fact.text,
      sourceUrl: check.fact.sourceUrl,
      evidence: check.fact.quote,
      provenance: check.fact.provenance,
    }));

    const angles = parsed.angles
      .map((angle): ProfileAngleInput | null => {
        const factIndex = indexMap.get(angle.factIndex);
        if (factIndex === undefined) return null;
        return {
          rank: angle.rank,
          title: angle.title,
          note: angle.note,
          angleType: angle.angleType,
          factIndex,
          chosen: angle.chosen,
        };
      })
      .filter((angle): angle is ProfileAngleInput => angle !== null);

    const noFacts = facts.length === 0;

    await this.engineRepository.persistProfile({
      organizationId: lead.organization_id,
      leadId: lead.id,
      summary: parsed.summary,
      qualification: noFacts ? "C" : parsed.qualification,
      score: noFacts ? Math.min(parsed.score, NO_FACTS_MAX_SCORE) : parsed.score,
      channel: parsed.channel,
      linkedinUrl: onlyHost(parsed.linkedinUrl, "linkedin.com"),
      instagramUrl: onlyHost(parsed.instagramUrl, "instagram.com"),
      facts,
      angles,
    });
    return true;
  }

  private async verifyFact(
    fact: ProfilerFact,
    companyHost: string | null,
    linkedinHost: string | null
  ): Promise<boolean> {
    const text = await fetchPageText(fact.sourceUrl, PROFILER_FETCH_TIMEOUT_MS);
    if (text === null) return false;
    if (!verifyQuote(text, fact.quote)) return false;

    if (fact.provenance === "own_source") {
      const host = hostOf(fact.sourceUrl);
      if (host === null) return false;
      const ownHosts = [companyHost, linkedinHost].filter(
        (candidate): candidate is string => candidate !== null
      );
      const matches = ownHosts.some(
        (own) =>
          host === own ||
          host.endsWith(`.${own}`) ||
          own.endsWith(`.${host}`)
      );
      if (!matches) return false;
    }
    return true;
  }

  private async runProfiler(
    lead: PgEngineLead,
    offer: EngineOffer
  ): Promise<ProfilerOutput | null> {
    const prompt = buildProfilerPrompt(lead, offer, todayLabel());
    const first = await this.tryResearch(prompt);
    if (first !== null) return first;
    return this.tryResearch(
      `${prompt}\n\nReminder: respond STRICTLY with the requested JSON, nothing else.`
    );
  }

  private async tryResearch(prompt: string): Promise<ProfilerOutput | null> {
    try {
      const raw = await this.llm.research({
        prompt,
        model: agentModel("profiler"),
      });
      return ProfilerOutputSchema.parse(extractJson(raw));
    } catch (error) {
      console.error(
        `[engine:profiler] research/parse failed: ${errorMessage(error)}`
      );
      return null;
    }
  }
}
