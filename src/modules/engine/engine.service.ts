import type { EngineRepository } from "./repository/engine/engine.repository.ts";
import type { ChasseurService } from "./agents/chasseur/chasseur.service.ts";
import type { ProfilerService } from "./agents/profiler/profiler.service.ts";
import type { CopywriterService } from "./agents/copywriter/copywriter.service.ts";
import { recordActivity } from "@shared/activity";
import type { EngineOffer } from "./engine.types.ts";
import type { PgEngineLead } from "./repository/engine/engine.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import { RunEngineErrors } from "./engine.errors.ts";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function leadLabel(lead: PgEngineLead): string {
  const name = [lead.first_name, lead.last_name]
    .filter((part) => part !== null && part !== "")
    .join(" ");
  const who = name === "" ? "prospect" : name;
  return lead.company_name === null ? who : `${who} (${lead.company_name})`;
}

export class EngineService {
  constructor(
    private readonly engineRepository: EngineRepository,
    private readonly chasseur: ChasseurService,
    private readonly profiler: ProfilerService,
    private readonly copywriter: CopywriterService
  ) {}

  async run(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.EngineRunSummaryDto | RunEngineErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return RunEngineErrors.noActiveOrganization;
    }

    const icps =
      await this.engineRepository.getIcpsByOrganization(organizationId);
    if (icps.length === 0) return RunEngineErrors.noIcps;

    try {
      await recordActivity({
        organizationId,
        type: "run_started",
        title: "Engine run started",
      });
      const offer = await this.buildOffer(organizationId);
      const sourced = await this.chasseur.source(organizationId, icps, offer);
      await recordActivity({
        organizationId,
        type: "sourced",
        title: `${sourced} new prospect(s) sourced`,
      });
      const profiled = await this.profileLeads(organizationId, offer);
      const drafted = await this.draftLeads(organizationId, offer);
      await recordActivity({
        organizationId,
        type: "run_done",
        title: `Run complete — ${sourced} sourced, ${profiled} researched, ${drafted} drafted`,
      });
      return { sourced, profiled, drafted };
    } catch (error) {
      console.error(
        `[engine] run failed orgId=${organizationId}: ${errorMessage(error)}`
      );
      return RunEngineErrors.runFailed;
    }
  }

  private async profileLeads(
    organizationId: string,
    offer: EngineOffer
  ): Promise<number> {
    const leads =
      await this.engineRepository.getLeadsNeedingProfile(organizationId);
    let profiled = 0;
    for (const lead of leads) {
      if (await this.profiler.profile(lead, offer)) {
        profiled += 1;
        await recordActivity({
          organizationId,
          type: "profiled",
          title: `Researched ${leadLabel(lead)}`,
          leadId: lead.id,
        });
      }
    }
    return profiled;
  }

  private async draftLeads(
    organizationId: string,
    offer: EngineOffer
  ): Promise<number> {
    const leads =
      await this.engineRepository.getLeadsNeedingCopy(organizationId);
    let drafted = 0;
    for (const lead of leads) {
      if (await this.copywriter.write(lead, offer)) {
        drafted += 1;
        await recordActivity({
          organizationId,
          type: "drafted",
          title: `Draft ready for ${leadLabel(lead)}`,
          leadId: lead.id,
        });
      }
    }
    return drafted;
  }

  private async buildOffer(organizationId: string): Promise<EngineOffer> {
    const [name, profile] = await Promise.all([
      this.engineRepository.getOrganizationName(organizationId),
      this.engineRepository.getOrganizationProfile(organizationId),
    ]);
    return {
      companyName: name ?? "",
      website: profile?.website ?? "",
      productPageUrl: profile?.product_page_url ?? "",
      salesDeckUrl: profile?.sales_deck_url ?? "",
      outreachLanguage: profile?.outreach_language ?? "fr",
      companyProfile: profile?.company_profile ?? "",
    };
  }
}

function resolveActiveOrganization(
  activeOrganizationId: string | null | undefined
): string | null {
  if (
    activeOrganizationId === null ||
    activeOrganizationId === undefined ||
    activeOrganizationId === ""
  ) {
    return null;
  }
  return activeOrganizationId;
}
