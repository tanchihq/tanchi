export type SignUpDto = Readonly<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
}>;

export type IcpDraft = Readonly<{
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

export type MarketDraft = Readonly<{
  name: string;
  country: string;
  outreachLanguage: string;
}>;

export type CompleteOnboardingDto = Readonly<{
  market: MarketDraft;
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  companyProfile: string;
  icps: ReadonlyArray<IcpDraft>;
}>;

export type GenerateProfileDto = Readonly<{
  market: MarketDraft;
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
}>;

export type SaveOnboardingProgressDto = Readonly<{
  step: number;
  draft: CompleteOnboardingDto;
}>;

export type GenerateIcpsDto = Readonly<{
  market: MarketDraft;
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  companyProfile: string;
  count: number;
}>;
