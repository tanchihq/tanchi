import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { rateLimit } from "@shared/ratelimit";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import {
  GENERATE_PROFILE_RATE_LIMIT,
  GENERATE_PROFILE_RATE_LIMIT_WINDOW_SECONDS,
  SIGN_UP_RATE_LIMIT,
  SIGN_UP_RATE_LIMIT_WINDOW_SECONDS,
} from "./onboarding.constants.ts";
import type { OnboardingService } from "./onboarding.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  CompleteOnboardingErrors,
  GenerateProfileErrors,
  OnboardingStateErrors,
  SaveOnboardingProgressErrors,
  SignUpErrors,
} from "./onboarding.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createOnboardingRouter(onboardingService: OnboardingService) {
  return new Hono<{ Variables: AuthVariables }>()
    .post(
      "/sign-up",
      rateLimit({
        name: "signUp",
        limit: SIGN_UP_RATE_LIMIT,
        windowSeconds: SIGN_UP_RATE_LIMIT_WINDOW_SECONDS,
        keyBy: "ip",
      }),
      zValidator("json", RequestDto.SignUpDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("json");
        const result = await onboardingService.signUp(dto);

        switch (result) {
          case SignUpErrors.invalidEmail:
          case SignUpErrors.invalidPassword:
          case SignUpErrors.invalidFirstName:
          case SignUpErrors.invalidLastName:
          case SignUpErrors.invalidCompany:
          case SignUpErrors.signUpFailed:
            return sendError(context, 400, result);
          case SignUpErrors.emailAlreadyExists:
            return sendError(context, 409, result);
          case SignUpErrors.signupDisabled:
            return sendError(context, 403, result);
          case SignUpErrors.organizationCreationFailed:
            return sendError(context, 500, result);
        }

        for (const cookie of result.setCookies) {
          context.header("Set-Cookie", cookie, { append: true });
        }
        return context.json(result.body, 201);
      }
    )
    .get("/state", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await onboardingService.getState(
        session.activeOrganizationId
      );

      switch (result) {
        case OnboardingStateErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    })
    .put(
      "/progress",
      requireAuth(),
      zValidator(
        "json",
        RequestDto.SaveOnboardingProgressDto,
        zodValidationHook
      ),
      async (context) => {
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await onboardingService.saveProgress(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case SaveOnboardingProgressErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case SaveOnboardingProgressErrors.invalidDraft:
            return sendError(context, 400, result);
        }

        return context.json(result);
      }
    )
    .post(
      "/complete",
      requireAuth(),
      zValidator("json", RequestDto.CompleteOnboardingDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await onboardingService.completeOnboarding(
          dto,
          session.activeOrganizationId,
          context.req.raw.headers
        );

        switch (result) {
          case CompleteOnboardingErrors.invalidCompanyName:
          case CompleteOnboardingErrors.invalidWebsite:
          case CompleteOnboardingErrors.invalidResource:
          case CompleteOnboardingErrors.invalidIcp:
          case CompleteOnboardingErrors.tooManyIcps:
            return sendError(context, 400, result);
          case CompleteOnboardingErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case CompleteOnboardingErrors.onboardingFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    )
    .post(
      "/generate-profile",
      requireAuth(),
      rateLimit({
        name: "onboarding-generate-profile",
        limit: GENERATE_PROFILE_RATE_LIMIT,
        windowSeconds: GENERATE_PROFILE_RATE_LIMIT_WINDOW_SECONDS,
      }),
      zValidator("json", RequestDto.GenerateProfileDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("json");
        const result = await onboardingService.generateProfile(dto);

        switch (result) {
          case GenerateProfileErrors.invalidWebsite:
            return sendError(context, 400, result);
          case GenerateProfileErrors.generationFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    );
}
