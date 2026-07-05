import type * as ResponseDto from "./dto/response/index.ts";
import type {
  PgIcp,
  PgOrganizationProfile,
} from "./repository/settings/settings.entities.ts";

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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
    icps: icps.map(convertPgIcpToSettingsIcpDto),
  };
}
