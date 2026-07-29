import type * as ResponseDto from "./dto/response/index.ts";
import type {
  PgIcp,
  PgMarket,
  PgOrganizationProfile,
} from "./repository/settings/settings.entities.ts";

export function convertPgIcpToSettingsIcpDto(
  icp: PgIcp
): ResponseDto.SettingsIcpDto {
  return {
    id: icp.id,
    name: icp.name,
    archetype: icp.archetype ?? "",
    description: icp.description,
    perceivedValue: icp.perceived_value ?? "",
    angle: icp.angle ?? "",
    goldenRule: icp.golden_rule ?? "",
  };
}

function convertPgMarketToSettingsMarketDto(
  market: PgMarket,
  icps: ReadonlyArray<PgIcp>
): ResponseDto.SettingsMarketDto {
  return {
    id: market.id,
    name: market.name,
    country: market.country,
    outreachLanguage: market.outreach_language,
    companyProfile: market.company_profile,
    followUp: {
      intervals: market.follow_up_intervals,
      excludedWeekdays: market.excluded_weekdays,
    },
    leadsPerDay: market.leads_per_day,
    icps: icps.map(convertPgIcpToSettingsIcpDto),
  };
}

export function convertToSettingsDto(
  organizationName: string,
  profile: PgOrganizationProfile | null,
  markets: ReadonlyArray<PgMarket>,
  icps: ReadonlyArray<PgIcp>
): ResponseDto.SettingsDto {
  const icpsByMarket = icps.reduce<Map<string, ReadonlyArray<PgIcp>>>(
    (accumulator, icp) => {
      const current = accumulator.get(icp.market_id) ?? [];
      return accumulator.set(icp.market_id, [...current, icp]);
    },
    new Map()
  );

  return {
    company: {
      name: organizationName,
      website: profile?.website ?? "",
    },
    resources: {
      productPageUrl: profile?.product_page_url ?? "",
      salesDeckUrl: profile?.sales_deck_url ?? "",
    },
    markets: markets.map((market) =>
      convertPgMarketToSettingsMarketDto(
        market,
        icpsByMarket.get(market.id) ?? []
      )
    ),
  };
}
