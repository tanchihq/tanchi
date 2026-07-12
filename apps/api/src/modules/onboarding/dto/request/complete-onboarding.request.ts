import { z } from "zod";
import { CompleteOnboardingErrors } from "../../onboarding.errors.ts";
import {
  MAX_COMPANY_LENGTH,
  MAX_COMPANY_PROFILE_LENGTH,
  MAX_ICP_DESCRIPTION_LENGTH,
  MAX_ICP_NAME_LENGTH,
  MAX_ICP_SHORT_FIELD_LENGTH,
  MAX_ICPS,
  MAX_URL_LENGTH,
} from "../../onboarding.constants.ts";
const websiteSchema = z
  .url({ error: CompleteOnboardingErrors.invalidWebsite })
  .max(MAX_URL_LENGTH, { message: CompleteOnboardingErrors.invalidWebsite });

const optionalResourceUrlSchema = z
  .url({ error: CompleteOnboardingErrors.invalidResource })
  .max(MAX_URL_LENGTH, { message: CompleteOnboardingErrors.invalidResource })
  .nullish();

const icpSchema = z.object({
  name: z
    .string({ error: CompleteOnboardingErrors.invalidIcp })
    .trim()
    .min(1, { message: CompleteOnboardingErrors.invalidIcp })
    .max(MAX_ICP_NAME_LENGTH, { message: CompleteOnboardingErrors.invalidIcp }),
  archetype: z
    .string({ error: CompleteOnboardingErrors.invalidIcp })
    .trim()
    .max(MAX_ICP_SHORT_FIELD_LENGTH, {
      message: CompleteOnboardingErrors.invalidIcp,
    }),
  description: z
    .string({ error: CompleteOnboardingErrors.invalidIcp })
    .trim()
    .min(1, { message: CompleteOnboardingErrors.invalidIcp })
    .max(MAX_ICP_DESCRIPTION_LENGTH, {
      message: CompleteOnboardingErrors.invalidIcp,
    }),
  perceivedValue: z
    .string({ error: CompleteOnboardingErrors.invalidIcp })
    .trim()
    .max(MAX_ICP_SHORT_FIELD_LENGTH, {
      message: CompleteOnboardingErrors.invalidIcp,
    }),
  angle: z
    .string({ error: CompleteOnboardingErrors.invalidIcp })
    .trim()
    .max(MAX_ICP_SHORT_FIELD_LENGTH, {
      message: CompleteOnboardingErrors.invalidIcp,
    }),
  goldenRule: z
    .string({ error: CompleteOnboardingErrors.invalidIcp })
    .trim()
    .max(MAX_ICP_SHORT_FIELD_LENGTH, {
      message: CompleteOnboardingErrors.invalidIcp,
    }),
});

export const CompleteOnboardingDto = z.object({
  companyName: z
    .string({ error: CompleteOnboardingErrors.invalidCompanyName })
    .trim()
    .min(1, { message: CompleteOnboardingErrors.invalidCompanyName })
    .max(MAX_COMPANY_LENGTH, {
      message: CompleteOnboardingErrors.invalidCompanyName,
    }),
  website: websiteSchema,
  productPageUrl: optionalResourceUrlSchema,
  salesDeckUrl: optionalResourceUrlSchema,
  companyProfile: z
    .string({ error: CompleteOnboardingErrors.invalidCompanyName })
    .max(MAX_COMPANY_PROFILE_LENGTH, {
      message: CompleteOnboardingErrors.invalidCompanyName,
    })
    .default(""),
  icps: z
    .array(icpSchema, { error: CompleteOnboardingErrors.invalidIcp })
    .min(1, { message: CompleteOnboardingErrors.invalidIcp })
    .max(MAX_ICPS, { message: CompleteOnboardingErrors.tooManyIcps }),
});

export type CompleteOnboardingDto = z.infer<typeof CompleteOnboardingDto>;
