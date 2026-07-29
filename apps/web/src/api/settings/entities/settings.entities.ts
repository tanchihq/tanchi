export type SettingsIcp = Readonly<{
  id: string | null;
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

export type SettingsFollowUp = Readonly<{
  intervals: ReadonlyArray<number>;
  excludedWeekdays: ReadonlyArray<number>;
}>;

export type SettingsMarket = Readonly<{
  id: string | null;
  name: string;
  country: string;
  outreachLanguage: string;
  companyProfile: string;
  leadsPerDay: number;
  followUp: SettingsFollowUp;
  icps: ReadonlyArray<SettingsIcp>;
}>;

export type SettingsDto = Readonly<{
  company: Readonly<{ name: string; website: string }>;
  resources: Readonly<{ productPageUrl: string | null; salesDeckUrl: string | null }>;
  markets: ReadonlyArray<SettingsMarket>;
}>;

export type GeneratedProfileDto = Readonly<{ companyProfile: string }>;
