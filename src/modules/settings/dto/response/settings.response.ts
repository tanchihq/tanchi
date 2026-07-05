export type SettingsIcpDto = Readonly<{
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

export type SettingsDto = Readonly<{
  company: Readonly<{
    name: string;
    website: string;
  }>;
  resources: Readonly<{
    productPageUrl: string;
    salesDeckUrl: string;
  }>;
  outreachLanguage: string;
  companyProfile: string;
  icps: ReadonlyArray<SettingsIcpDto>;
}>;

export type GeneratedCompanyProfileDto = Readonly<{
  companyProfile: string;
}>;
