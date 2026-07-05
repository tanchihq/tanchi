export type SettingsIcp = Readonly<{
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

export type SettingsDto = Readonly<{
  company: Readonly<{ name: string; website: string }>;
  resources: Readonly<{ productPageUrl: string; salesDeckUrl: string }>;
  outreachLanguage: string;
  companyProfile: string;
  icps: ReadonlyArray<SettingsIcp>;
}>;

export type GeneratedProfileDto = Readonly<{ companyProfile: string }>;
