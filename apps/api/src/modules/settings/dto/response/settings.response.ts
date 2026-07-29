export type SettingsIcpDto = Readonly<{
  id: string;
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

export type SettingsMarketDto = Readonly<{
  id: string;
  name: string;
  country: string;
  outreachLanguage: string;
  companyProfile: string;
  followUp: Readonly<{
    intervals: ReadonlyArray<number>;
    excludedWeekdays: ReadonlyArray<number>;
  }>;
  leadsPerDay: number;
  icps: ReadonlyArray<SettingsIcpDto>;
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
  markets: ReadonlyArray<SettingsMarketDto>;
}>;

export type GeneratedCompanyProfileDto = Readonly<{
  companyProfile: string;
}>;
