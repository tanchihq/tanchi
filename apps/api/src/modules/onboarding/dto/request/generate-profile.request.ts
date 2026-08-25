import { z } from "zod";
import { SUPPORTED_OUTREACH_LANGUAGES } from "@shared/company-profile";
import { GenerateProfileErrors } from "../../onboarding.errors.ts";
import {
  COUNTRY_CODE_LENGTH,
  MAX_COMPANY_LENGTH,
  MAX_MARKET_NAME_LENGTH,
} from "../../onboarding.constants.ts";

export const GenerateProfileDto = z.object({
  market: z.object({
    name: z
      .string({ error: GenerateProfileErrors.invalidWebsite })
      .trim()
      .min(1, { message: GenerateProfileErrors.invalidWebsite })
      .max(MAX_MARKET_NAME_LENGTH, { message: GenerateProfileErrors.invalidWebsite }),
    country: z
      .string({ error: GenerateProfileErrors.invalidWebsite })
      .trim()
      .toUpperCase()
      .length(COUNTRY_CODE_LENGTH, { message: GenerateProfileErrors.invalidWebsite }),
    outreachLanguage: z
      .string({ error: GenerateProfileErrors.invalidWebsite })
      .trim()
      .refine((value) => SUPPORTED_OUTREACH_LANGUAGES.includes(value), {
        message: GenerateProfileErrors.invalidWebsite,
      }),
  }),
  companyName: z
    .string({ error: GenerateProfileErrors.invalidWebsite })
    .trim()
    .max(MAX_COMPANY_LENGTH)
    .nullish(),
  website: z.url({ error: GenerateProfileErrors.invalidWebsite }),
  productPageUrl: z.url({ error: GenerateProfileErrors.invalidWebsite }).nullish(),
  salesDeckUrl: z.url({ error: GenerateProfileErrors.invalidWebsite }).nullish(),
});

export type GenerateProfileDto = z.infer<typeof GenerateProfileDto>;
