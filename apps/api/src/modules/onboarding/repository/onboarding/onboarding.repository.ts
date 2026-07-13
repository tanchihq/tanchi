import type { OnboardingPostgres } from "./onboarding.postgres.ts";
import type {
  CompleteOnboardingInput,
  CreateOrganizationWithOwnerInput,
  PgOnboardingState,
  UpsertOnboardingProgressInput,
} from "./onboarding.entities.ts";

export class OnboardingRepository {
  constructor(private readonly onboardingPostgres: OnboardingPostgres) {}

  existsUserByEmail(email: string): Promise<boolean> {
    return this.onboardingPostgres.existsUserByEmail(email);
  }

  deleteOneUser(id: string): Promise<void> {
    return this.onboardingPostgres.deleteOneUser(id);
  }

  deleteOneOrganization(id: string): Promise<void> {
    return this.onboardingPostgres.deleteOneOrganization(id);
  }

  createOrganizationWithOwner(
    input: CreateOrganizationWithOwnerInput
  ): Promise<void> {
    return this.onboardingPostgres.createOrganizationWithOwner(input);
  }

  getOneOnboardingStateByOrganization(
    organizationId: string
  ): Promise<PgOnboardingState | null> {
    return this.onboardingPostgres.getOneOnboardingStateByOrganization(
      organizationId
    );
  }

  getOrganizationNameById(organizationId: string): Promise<string | null> {
    return this.onboardingPostgres.getOrganizationNameById(organizationId);
  }

  upsertOnboardingProgress(
    input: UpsertOnboardingProgressInput
  ): Promise<void> {
    return this.onboardingPostgres.upsertOnboardingProgress(input);
  }

  completeOnboarding(input: CompleteOnboardingInput): Promise<void> {
    return this.onboardingPostgres.completeOnboarding(input);
  }
}
