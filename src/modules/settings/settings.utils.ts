import type * as ResponseDto from "./dto/response/index.ts";
import type {
  PgIcp,
  PgOrganizationProfile,
} from "./repository/settings/settings.entities.ts";
import {
  DEFAULT_EXCLUDED_WEEKDAYS,
  DEFAULT_FOLLOW_UP_INTERVALS,
} from "./settings.constants.ts";

export function convertPgIcpToSettingsIcpDto(
  icp: PgIcp
): ResponseDto.SettingsIcpDto {
  return {
    name: icp.name,
    archetype: icp.archetype ?? "",
    description: icp.description,
    perceivedValue: icp.perceived_value ?? "",
    angle: icp.angle ?? "",
    goldenRule: icp.golden_rule ?? "",
  };
}

export function convertToSettingsDto(
  organizationName: string,
  profile: PgOrganizationProfile | null,
  icps: ReadonlyArray<PgIcp>
): ResponseDto.SettingsDto {
  return {
    company: {
      name: organizationName,
      website: profile?.website ?? "",
    },
    resources: {
      productPageUrl: profile?.product_page_url ?? "",
      salesDeckUrl: profile?.sales_deck_url ?? "",
    },
    outreachLanguage: profile?.outreach_language ?? "fr",
    companyProfile: profile?.company_profile ?? "",
    followUp: {
      intervals: profile?.follow_up_intervals ?? DEFAULT_FOLLOW_UP_INTERVALS,
      excludedWeekdays: profile?.excluded_weekdays ?? DEFAULT_EXCLUDED_WEEKDAYS,
    },
    icps: icps.map(convertPgIcpToSettingsIcpDto),
  };
}
