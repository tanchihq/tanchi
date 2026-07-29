import { generateCompanyProfile } from "@shared/company-profile";
import type { SettingsRepository } from "./repository/settings/settings.repository.ts";
import {
  GenerateCompanyProfileErrors,
  GetSettingsErrors,
  UpdateSettingsErrors,
} from "./settings.errors.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./settings.utils.ts";

export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async getSettings(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.SettingsDto | GetSettingsErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetSettingsErrors.noActiveOrganization;
    }
    return this.readSettings(organizationId);
  }

  async updateSettings(
    dto: RequestDto.UpdateSettingsDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.SettingsDto | UpdateSettingsErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return UpdateSettingsErrors.noActiveOrganization;
    }

    try {
      await this.settingsRepository.updateSettings({
        organizationId,
        companyName: dto.company.name,
        website: dto.company.website,
        productPageUrl: dto.resources.productPageUrl ?? "",
        salesDeckUrl: dto.resources.salesDeckUrl ?? "",
        markets: dto.markets.map((market) => ({
          id: market.id,
          name: market.name,
          country: market.country,
          outreachLanguage: market.outreachLanguage,
          companyProfile: market.companyProfile,
          followUpIntervals: market.followUp.intervals,
          excludedWeekdays: market.followUp.excludedWeekdays,
          leadsPerDay: market.leadsPerDay,
          icps: market.icps.map((icp) => ({
            id: icp.id,
            name: icp.name,
            archetype: icp.archetype,
            description: icp.description,
            perceivedValue: icp.perceivedValue,
            angle: icp.angle,
            goldenRule: icp.goldenRule,
          })),
        })),
      });
    } catch (error) {
      console.error(
        `[settings] updateSettings failed orgId=${organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return UpdateSettingsErrors.updateFailed;
    }

    return this.readSettings(organizationId);
  }

  async generateProfile(
    activeOrganizationId: string | null | undefined
  ): Promise<
    ResponseDto.GeneratedCompanyProfileDto | GenerateCompanyProfileErrors
  > {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GenerateCompanyProfileErrors.noActiveOrganization;
    }

    const [name, profile] = await Promise.all([
      this.settingsRepository.getOrganizationNameById(organizationId),
      this.settingsRepository.getOrganizationProfileByOrganization(
        organizationId
      ),
    ]);

    try {
      const companyProfile = await generateCompanyProfile({
        companyName: name ?? "",
        website: profile?.website ?? "",
        productPageUrl: profile?.product_page_url ?? "",
        salesDeckUrl: profile?.sales_deck_url ?? "",
      });
      return { companyProfile };
    } catch (error) {
      console.error(
        `[settings] generateProfile failed orgId=${organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return GenerateCompanyProfileErrors.generationFailed;
    }
  }

  private async readSettings(
    organizationId: string
  ): Promise<ResponseDto.SettingsDto> {
    const [organizationName, profile, markets, icps] = await Promise.all([
      this.settingsRepository.getOrganizationNameById(organizationId),
      this.settingsRepository.getOrganizationProfileByOrganization(
        organizationId
      ),
      this.settingsRepository.getMarketsByOrganization(organizationId),
      this.settingsRepository.getIcpsByOrganization(organizationId),
    ]);
    return utils.convertToSettingsDto(
      organizationName ?? "",
      profile,
      markets,
      icps
    );
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
