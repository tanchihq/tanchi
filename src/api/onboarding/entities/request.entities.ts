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

export type CompleteOnboardingDto = Readonly<{
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  companyProfile: string;
  icps: ReadonlyArray<IcpDraft>;
}>;

export type GenerateProfileDto = Readonly<{
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
}>;

export type SaveOnboardingProgressDto = Readonly<{
  step: number;
  draft: CompleteOnboardingDto;
}>;
