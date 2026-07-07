export type SettingsIcp = Readonly<{
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

export type SettingsDto = Readonly<{
  company: Readonly<{ name: string; website: string }>;
  resources: Readonly<{ productPageUrl: string | null; salesDeckUrl: string | null }>;
  outreachLanguage: string;
  companyProfile: string;
  followUp: SettingsFollowUp;
  icps: ReadonlyArray<SettingsIcp>;
}>;

export type GeneratedProfileDto = Readonly<{ companyProfile: string }>;
