import { z } from "zod";
import { SUPPORTED_OUTREACH_LANGUAGES } from "@shared/company-profile";
import { GenerateIcpsErrors } from "../../onboarding.errors.ts";
import {
  COUNTRY_CODE_LENGTH,
  MAX_COMPANY_LENGTH,
  MAX_MARKET_NAME_LENGTH,
  MAX_COMPANY_PROFILE_LENGTH,
  MAX_ICPS,
} from "../../onboarding.constants.ts";

export const GenerateIcpsDto = z.object({
  market: z.object({
    name: z
      .string({ error: GenerateIcpsErrors.invalidWebsite })
      .trim()
      .min(1, { message: GenerateIcpsErrors.invalidWebsite })
      .max(MAX_MARKET_NAME_LENGTH, { message: GenerateIcpsErrors.invalidWebsite }),
    country: z
      .string({ error: GenerateIcpsErrors.invalidWebsite })
      .trim()
      .toUpperCase()
      .length(COUNTRY_CODE_LENGTH, { message: GenerateIcpsErrors.invalidWebsite }),
    outreachLanguage: z
      .string({ error: GenerateIcpsErrors.invalidWebsite })
      .trim()
      .refine((value) => SUPPORTED_OUTREACH_LANGUAGES.includes(value), {
        message: GenerateIcpsErrors.invalidWebsite,
      }),
  }),
  companyName: z
    .string({ error: GenerateIcpsErrors.invalidWebsite })
    .trim()
    .max(MAX_COMPANY_LENGTH)
    .nullish(),
  website: z.url({ error: GenerateIcpsErrors.invalidWebsite }),
  productPageUrl: z.url({ error: GenerateIcpsErrors.invalidWebsite }).nullish(),
  salesDeckUrl: z.url({ error: GenerateIcpsErrors.invalidWebsite }).nullish(),
  companyProfile: z
    .string({ error: GenerateIcpsErrors.invalidWebsite })
    .max(MAX_COMPANY_PROFILE_LENGTH)
    .nullish(),
  count: z.coerce.number().int().min(1).max(MAX_ICPS).default(MAX_ICPS),
});

export type GenerateIcpsDto = z.infer<typeof GenerateIcpsDto>;
