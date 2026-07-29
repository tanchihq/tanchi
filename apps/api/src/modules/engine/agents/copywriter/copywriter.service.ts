import type { LlmProvider } from "@shared/llm";
import { agentModel } from "@shared/llm";
import type { EngineRepository } from "../../repository/engine/engine.repository.ts";
import type { PgEngineLead } from "../../repository/engine/engine.entities.ts";
import type { EngineOffer } from "../../engine.types.ts";
import type { CopyOutput } from "./copywriter.schemas.ts";
import { CopyOutputSchema } from "./copywriter.schemas.ts";
import { extractJson, lengthBucket } from "../../engine.utils.ts";
import { todayLabel } from "@shared/utils";
import { COPY_TEMPERATURE, EXPLORATION_RATE } from "../../engine.constants.ts";
import {
  buildAngleInferencePrompt,
  buildCopywriterPrompt,
  type CopywriterContext,
} from "./copywriter.prompt.ts";

const ANGLE_INFERENCE_MAX_TOKENS = 20;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class CopywriterService {
  constructor(
    private readonly engineRepository: EngineRepository,
    private readonly llm: LlmProvider
  ) {}

  async write(lead: PgEngineLead, offer: EngineOffer): Promise<boolean> {
    const [summary, facts, angle, playbook] = await Promise.all([
      this.engineRepository.getDossierSummaryForLead(lead.id),
      this.engineRepository.getFactsForLead(lead.id),
      this.engineRepository.getChosenAngleForLead(lead.id),
      lead.icp_id === null
        ? Promise.resolve(null)
        : this.engineRepository.getLatestPlaybook(
            lead.organization_id,
            lead.icp_id
          ),
    ]);

    const isExploration = Math.random() < EXPLORATION_RATE;
    const parsed = await this.generateCopy({
      lead,
      offer,
      market: {
        country: lead.country,
        outreachLanguage: lead.outreach_language,
        companyProfile: lead.company_profile,
      },
      summary,
      facts,
      angle,
      playbook,
      isExploration,
      today: todayLabel(),
    });
    if (parsed === null) return false;

    const angleTypeInferred = await this.inferAngle(parsed.body);

    await this.engineRepository.createOneMessageDraft({
      organizationId: lead.organization_id,
      leadId: lead.id,
      icpId: lead.icp_id,
      channel: lead.channel,
      subject: lead.channel === "email" ? parsed.subject : null,
      body: parsed.body,
      angleType: angle?.angle_type ?? null,
      angleTypeInferred,
      lengthBucket: lengthBucket(parsed.body),
      ctaType: null,
      persoDepth: null,
      slot: null,
      isExploration,
    });
    return true;
  }

  private async generateCopy(
    context: CopywriterContext
  ): Promise<CopyOutput | null> {
    try {
      const raw = await this.llm.generate({
        prompt: buildCopywriterPrompt(context),
        temperature: COPY_TEMPERATURE,
        model: agentModel("copywriter"),
      });
      return CopyOutputSchema.parse(extractJson(raw));
    } catch (error) {
      console.error(
        `[engine:copywriter] generation failed leadId=${context.lead.id}: ${errorMessage(error)}`
      );
      return null;
    }
  }

  private async inferAngle(body: string): Promise<string | null> {
    try {
      const raw = await this.llm.generate({
        prompt: buildAngleInferencePrompt(body),
        maxTokens: ANGLE_INFERENCE_MAX_TOKENS,
        model: agentModel("copywriter"),
      });
      return raw.trim().toLowerCase().split(/\s+/)[0] ?? null;
    } catch {
      return null;
    }
  }
}
