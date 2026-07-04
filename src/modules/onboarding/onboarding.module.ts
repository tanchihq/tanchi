import { auth } from "@shared/auth";
import { db } from "../../db.ts";
import { OnboardingPostgres } from "./repository/onboarding/onboarding.postgres.ts";
import { OnboardingRepository } from "./repository/onboarding/onboarding.repository.ts";
import { OnboardingService } from "./onboarding.service.ts";
import { createOnboardingRouter } from "./onboarding.controller.ts";

const onboardingRepository = new OnboardingRepository(
  new OnboardingPostgres(db)
);

const onboardingService = new OnboardingService(auth, onboardingRepository);

export const onboardingRouter = createOnboardingRouter(onboardingService);
