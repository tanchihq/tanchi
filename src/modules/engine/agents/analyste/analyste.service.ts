import type { LlmProvider } from "@shared/llm";
import { agentModel } from "@shared/llm";
import { todayLabel } from "@shared/utils";
import type { EngineRepository } from "../../repository/engine/engine.repository.ts";
import type { PgEngineIcp } from "../../repository/engine/engine.entities.ts";
import {
  ANALYSTE_MAX_EDITS,
  ANALYSTE_MAX_EXAMPLES,
  ANALYSTE_PLAYBOOK_MAX_TOKENS,
  ANALYSTE_TEMPERATURE,
  ANALYSTE_WINDOW_DAYS,
} from "../../engine.constants.ts";
import { buildStatsText } from "./analyste.utils.ts";
import {
  buildPlaybookPrompt,
  PLAYBOOK_SYSTEM,
} from "./analyste.prompt.ts";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class AnalysteService {
  constructor(
    private readonly engineRepository: EngineRepository,
    private readonly llm: LlmProvider
  ) {}

  async distill(organizationId: string): Promise<number> {
    const [icps, profile] = await Promise.all([
      this.engineRepository.getIcpsByOrganization(organizationId),
      this.engineRepository.getOrganizationProfile(organizationId),
    ]);
    if (icps.length === 0) return 0;

    const outreachLanguage = profile?.outreach_language ?? "fr";
    let written = 0;
    for (const icp of icps) {
      if (await this.distillIcp(organizationId, icp, outreachLanguage)) {
        written += 1;
      }
    }
    return written;
  }

  private async distillIcp(
    organizationId: string,
    icp: PgEngineIcp,
    outreachLanguage: string
  ): Promise<boolean> {
    const [rows, edits, previousPlaybook] = await Promise.all([
      this.engineRepository.getSentMessageOutcomesForIcp(
        organizationId,
        icp.id,
        ANALYSTE_WINDOW_DAYS
      ),
      this.engineRepository.getRecentEditsForIcp(
        organizationId,
        icp.id,
        ANALYSTE_MAX_EDITS
      ),
      this.engineRepository.getLatestPlaybook(organizationId, icp.id),
    ]);

    if (rows.length === 0 && edits.length === 0) return false;

    const examples = rows
      .filter((row) => row.positive)
      .slice(0, ANALYSTE_MAX_EXAMPLES);

    try {
      const content = await this.llm.generate({
        system: PLAYBOOK_SYSTEM,
        model: agentModel("analyste"),
        prompt: buildPlaybookPrompt({
          icp,
          statsText: buildStatsText(rows),
          examples,
          edits,
          previousPlaybook,
          outreachLanguage,
          today: todayLabel(),
          totalSent: rows.length,
        }),
        maxTokens: ANALYSTE_PLAYBOOK_MAX_TOKENS,
        temperature: ANALYSTE_TEMPERATURE,
      });
      const trimmed = content.trim();
      if (trimmed === "") return false;

      await this.engineRepository.insertPlaybook(
        organizationId,
        icp.id,
        trimmed
      );
      return true;
    } catch (error) {
      console.error(
        `[engine:analyste] distill failed icp=${icp.id}: ${errorMessage(error)}`
      );
      return false;
    }
  }
}
