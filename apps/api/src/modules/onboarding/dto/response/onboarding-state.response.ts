export type OnboardingStatusDto = "in_progress" | "completed";

export type OnboardingDraftIcpDto = Readonly<{
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

export type OnboardingDraftDto = Readonly<{
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  icps: ReadonlyArray<OnboardingDraftIcpDto>;
}>;

export type OnboardingStateDto = Readonly<{
  status: OnboardingStatusDto;
  step: number;
  draft: OnboardingDraftDto;
}>;

export type OnboardingActionResultDto = Readonly<{
  status: true;
}>;
