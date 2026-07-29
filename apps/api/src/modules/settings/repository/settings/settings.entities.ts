type PgOrganizationProfile = Readonly<{
  organization_id: string;
  website: string;
  product_page_url: string | null;
  sales_deck_url: string | null;
  onboarded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}>;

type PgMarket = Readonly<{
  id: string;
  organization_id: string;
  name: string;
  country: string;
  outreach_language: string;
  company_profile: string;
  leads_per_day: number;
  follow_up_intervals: ReadonlyArray<number>;
  excluded_weekdays: ReadonlyArray<number>;
  position: number;
  created_at: Date;
}>;

type PgIcp = Readonly<{
  id: string;
  organization_id: string;
  market_id: string;
  name: string;
  archetype: string | null;
  description: string;
  perceived_value: string | null;
  angle: string | null;
  golden_rule: string | null;
  position: number;
  created_at: Date;
}>;

type IcpInput = Readonly<{
  id: string | null;
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

type MarketInput = Readonly<{
  id: string | null;
  name: string;
  country: string;
  outreachLanguage: string;
  companyProfile: string;
  followUpIntervals: ReadonlyArray<number>;
  excludedWeekdays: ReadonlyArray<number>;
  leadsPerDay: number;
  icps: ReadonlyArray<IcpInput>;
}>;

type UpdateSettingsInput = Readonly<{
  organizationId: string;
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  markets: ReadonlyArray<MarketInput>;
}>;

export type {
  IcpInput,
  MarketInput,
  PgIcp,
  PgMarket,
  PgOrganizationProfile,
  UpdateSettingsInput,
};
