import { APIError } from "better-auth/api";
import { generateCompanyProfile } from "@shared/company-profile";
import type { auth as authInstance } from "@shared/auth";
import type { OnboardingRepository } from "./repository/onboarding/onboarding.repository.ts";
import {
  CompleteOnboardingErrors,
  GenerateProfileErrors,
  OnboardingStateErrors,
  SaveOnboardingProgressErrors,
  SignUpErrors,
} from "./onboarding.errors.ts";
import { MAX_STEP, MIN_STEP } from "./onboarding.constants.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./onboarding.utils.ts";

type Auth = typeof authInstance;

export type SignUpSuccess = Readonly<{
  setCookies: ReadonlyArray<string>;
  body: ResponseDto.SignedUpDto;
}>;

export class OnboardingService {
  constructor(
    private readonly auth: Auth,
    private readonly onboardingRepository: OnboardingRepository
  ) {}

  async signUp(
    dto: RequestDto.SignUpDto
  ): Promise<SignUpSuccess | SignUpErrors> {
    const name = `${dto.firstName} ${dto.lastName}`;

    const userId = await this.tryCreateUser({
      email: dto.email,
      password: dto.password,
      name,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    if (userId === SignUpErrors.emailAlreadyExists) return userId;
    if (userId === SignUpErrors.signUpFailed) return userId;

    const organizationId = Bun.randomUUIDv7();
    const slug = utils.buildOrgSlug(dto.company);
    const organizationCreated = await this.tryCreateOrganization({
      organizationId,
      name: dto.company,
      slug,
      userId,
    });
    if (!organizationCreated) {
      await this.safeDeleteUser(userId);
      return SignUpErrors.organizationCreationFailed;
    }

    const setCookies = await this.trySignIn(dto.email, dto.password);
    if (setCookies === null) {
      await this.safeDeleteOrganization(organizationId);
      await this.safeDeleteUser(userId);
      return SignUpErrors.signUpFailed;
    }

    return {
      setCookies,
      body: utils.convertToSignedUpDto(
        {
          id: userId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          name,
        },
        { id: organizationId, name: dto.company, slug }
      ),
    };
  }

  async getState(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.OnboardingStateDto | OnboardingStateErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return OnboardingStateErrors.noActiveOrganization;
    }

    const state =
      await this.onboardingRepository.getOneOnboardingStateByOrganization(
        organizationId
      );

    if (state === null) {
      const organizationName =
        (await this.onboardingRepository.getOrganizationNameById(
          organizationId
        )) ?? "";
      return {
        status: "in_progress",
        step: MIN_STEP,
        draft: utils.buildInitialDraft(organizationName),
      };
    }

    return {
      status: state.status,
      step: state.current_step,
      draft: utils.normalizeDraft(state.draft),
    };
  }

  async saveProgress(
    dto: RequestDto.SaveOnboardingProgressDto,
    activeOrganizationId: string | null | undefined
  ): Promise<
    ResponseDto.OnboardingActionResultDto | SaveOnboardingProgressErrors
  > {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return SaveOnboardingProgressErrors.noActiveOrganization;
    }

    await this.onboardingRepository.upsertOnboardingProgress({
      organizationId,
      currentStep: clampStep(dto.step),
      draft: utils.normalizeDraft(dto.draft),
    });

    return { status: true };
  }

  async completeOnboarding(
    dto: RequestDto.CompleteOnboardingDto,
    activeOrganizationId: string | null | undefined,
    headers: Headers
  ): Promise<
    ResponseDto.OnboardingActionResultDto | CompleteOnboardingErrors
  > {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return CompleteOnboardingErrors.noActiveOrganization;
    }

    const renamed = await this.tryRenameOrganization(
      organizationId,
      dto.companyName,
      headers
    );
    if (!renamed) return CompleteOnboardingErrors.onboardingFailed;

    try {
      await this.onboardingRepository.completeOnboarding({
        organizationId,
        currentStep: MAX_STEP,
        draft: utils.normalizeDraft(dto),
        profile: {
          website: dto.website,
          productPageUrl: dto.productPageUrl ?? "",
          salesDeckUrl: dto.salesDeckUrl ?? "",
          companyProfile: dto.companyProfile,
        },
        icps: dto.icps,
      });
    } catch (error) {
      console.error(
        `[onboarding] completeOnboarding persist failed orgId=${organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return CompleteOnboardingErrors.onboardingFailed;
    }

    return { status: true };
  }

  async generateProfile(
    dto: RequestDto.GenerateProfileDto
  ): Promise<ResponseDto.GeneratedProfileDto | GenerateProfileErrors> {
    try {
      const companyProfile = await generateCompanyProfile({
        companyName: dto.companyName ?? "",
        website: dto.website,
        productPageUrl: dto.productPageUrl ?? "",
        salesDeckUrl: dto.salesDeckUrl ?? "",
      });
      return { companyProfile };
    } catch (error) {
      console.error(
        `[onboarding] generateProfile failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return GenerateProfileErrors.generationFailed;
    }
  }

  private async tryCreateUser(
    body: Readonly<{
      email: string;
      password: string;
      name: string;
      firstName: string;
      lastName: string;
    }>
  ): Promise<string | SignUpErrors.emailAlreadyExists | SignUpErrors.signUpFailed> {
    try {
      const result = await this.auth.api.signUpEmail({ body });
      return result.user.id;
    } catch (error) {
      if (isUserAlreadyExistsError(error)) {
        return SignUpErrors.emailAlreadyExists;
      }
      console.error(
        `[onboarding] signUpEmail failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return SignUpErrors.signUpFailed;
    }
  }

  private async tryCreateOrganization(
    input: Readonly<{
      organizationId: string;
      name: string;
      slug: string;
      userId: string;
    }>
  ): Promise<boolean> {
    try {
      await this.onboardingRepository.createOrganizationWithOwner({
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        userId: input.userId,
        memberId: Bun.randomUUIDv7(),
      });
      return true;
    } catch (error) {
      console.error(
        `[onboarding] createOrganizationWithOwner failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  private async trySignIn(
    email: string,
    password: string
  ): Promise<ReadonlyArray<string> | null> {
    try {
      const result = await this.auth.api.signInEmail({
        body: { email, password },
        returnHeaders: true,
      });
      return result.headers.getSetCookie();
    } catch (error) {
      console.error(
        `[onboarding] signInEmail failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }

  private async tryRenameOrganization(
    organizationId: string,
    name: string,
    headers: Headers
  ): Promise<boolean> {
    try {
      await this.auth.api.updateOrganization({
        headers,
        body: { data: { name }, organizationId },
      });
      return true;
    } catch (error) {
      console.error(
        `[onboarding] updateOrganization failed orgId=${organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  private async safeDeleteUser(id: string): Promise<void> {
    try {
      await this.onboardingRepository.deleteOneUser(id);
    } catch (error) {
      console.error(
        `[onboarding] compensating deleteOneUser failed userId=${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async safeDeleteOrganization(id: string): Promise<void> {
    try {
      await this.onboardingRepository.deleteOneOrganization(id);
    } catch (error) {
      console.error(
        `[onboarding] compensating deleteOneOrganization failed orgId=${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

function resolveActiveOrganization(
  activeOrganizationId: string | null | undefined
): string | null {
  if (
    activeOrganizationId === null ||
    activeOrganizationId === undefined ||
    activeOrganizationId === ""
  ) {
    return null;
  }
  return activeOrganizationId;
}

function clampStep(step: number): number {
  return Math.min(MAX_STEP, Math.max(MIN_STEP, Math.trunc(step)));
}

function isUserAlreadyExistsError(error: unknown): boolean {
  if (!(error instanceof APIError)) return false;
  const body = error.body as Readonly<{ code?: string }> | undefined;
  return body?.code === "USER_ALREADY_EXISTS";
}
