type PgOrganizationProfile = Readonly<{
  organization_id: string;
  website: string;
  product_page_url: string | null;
  sales_deck_url: string | null;
  outreach_language: string;
  company_profile: string;
  follow_up_intervals: ReadonlyArray<number>;
  excluded_weekdays: ReadonlyArray<number>;
  leads_per_day: number;
  onboarded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}>;

type PgIcp = Readonly<{
  id: string;
  organization_id: string;
  name: string;
  archetype: string | null;
  description: string;
  perceived_value: string | null;
  angle: string | null;
  golden_rule: string | null;
  position: number;
  created_at: Date;
}>;

type UpdateSettingsInput = Readonly<{
  organizationId: string;
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  outreachLanguage: string;
  companyProfile: string;
  followUpIntervals: ReadonlyArray<number>;
  excludedWeekdays: ReadonlyArray<number>;
  leadsPerDay: number;
  icps: ReadonlyArray<
    Readonly<{
      name: string;
      archetype: string;
      description: string;
      perceivedValue: string;
      angle: string;
      goldenRule: string;
    }>
  >;
}>;

export type { PgIcp, PgOrganizationProfile, UpdateSettingsInput };
