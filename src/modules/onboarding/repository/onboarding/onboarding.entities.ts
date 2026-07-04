type PgOnboardingStateStatus = "in_progress" | "completed";

type PgOnboardingState = Readonly<{
  organization_id: string;
  status: PgOnboardingStateStatus;
  current_step: number;
  draft: Readonly<Record<string, unknown>>;
  updated_at: Date;
}>;

type CreateOrganizationWithOwnerInput = Readonly<{
  organizationId: string;
  name: string;
  slug: string;
  userId: string;
  memberId: string;
}>;

type UpsertOnboardingProgressInput = Readonly<{
  organizationId: string;
  currentStep: number;
  draft: Readonly<Record<string, unknown>>;
}>;

type CompleteOnboardingInput = Readonly<{
  organizationId: string;
  currentStep: number;
  draft: Readonly<Record<string, unknown>>;
  profile: Readonly<{
    website: string;
    productPageUrl: string;
    salesDeckUrl: string;
  }>;
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

export type {
  CompleteOnboardingInput,
  CreateOrganizationWithOwnerInput,
  PgOnboardingState,
  PgOnboardingStateStatus,
  UpsertOnboardingProgressInput,
};
