import { z } from "zod";
import { SUPPORTED_OUTREACH_LANGUAGES } from "@shared/company-profile";
import { GenerateCompanyProfileErrors } from "../../settings.errors.ts";
import {
  COUNTRY_CODE_LENGTH,
  MAX_MARKET_NAME_LENGTH,
} from "../../settings.constants.ts";

export const GenerateCompanyProfileDto = z.object({
  market: z.object({
    name: z
      .string({ error: GenerateCompanyProfileErrors.invalidMarket })
      .trim()
      .min(1, { message: GenerateCompanyProfileErrors.invalidMarket })
      .max(MAX_MARKET_NAME_LENGTH, {
        message: GenerateCompanyProfileErrors.invalidMarket,
      }),
    country: z
      .string({ error: GenerateCompanyProfileErrors.invalidMarket })
      .trim()
      .toUpperCase()
      .length(COUNTRY_CODE_LENGTH, {
        message: GenerateCompanyProfileErrors.invalidMarket,
      }),
    outreachLanguage: z
      .string({ error: GenerateCompanyProfileErrors.invalidMarket })
      .trim()
      .refine((value) => SUPPORTED_OUTREACH_LANGUAGES.includes(value), {
        message: GenerateCompanyProfileErrors.invalidMarket,
      }),
  }),
});

export type GenerateCompanyProfileDto = z.infer<typeof GenerateCompanyProfileDto>;
