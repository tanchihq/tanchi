import { z } from "zod";
import { GenerateProfileErrors } from "../../onboarding.errors.ts";
import { MAX_COMPANY_LENGTH } from "../../onboarding.constants.ts";

export const GenerateProfileDto = z.object({
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
