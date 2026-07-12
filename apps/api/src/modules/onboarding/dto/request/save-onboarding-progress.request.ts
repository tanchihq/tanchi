import { z } from "zod";
import { SaveOnboardingProgressErrors } from "../../onboarding.errors.ts";
import {
  MAX_DRAFT_ICPS,
  MAX_DRAFT_TEXT_LENGTH,
} from "../../onboarding.constants.ts";

const laxText = z
  .string()
  .max(MAX_DRAFT_TEXT_LENGTH, {
    message: SaveOnboardingProgressErrors.invalidDraft,
  })
  .optional();

const laxIcpSchema = z.object({
  name: laxText,
  archetype: laxText,
  description: laxText,
  perceivedValue: laxText,
  angle: laxText,
  goldenRule: laxText,
});

const laxDraftSchema = z.object({
  companyName: laxText,
  website: laxText,
  productPageUrl: laxText,
  salesDeckUrl: laxText,
  icps: z
    .array(laxIcpSchema)
    .max(MAX_DRAFT_ICPS, {
      message: SaveOnboardingProgressErrors.invalidDraft,
    })
    .optional(),
});

export const SaveOnboardingProgressDto = z.object({
  step: z
    .number({ error: SaveOnboardingProgressErrors.invalidDraft })
    .int({ message: SaveOnboardingProgressErrors.invalidDraft }),
  draft: laxDraftSchema,
});

export type SaveOnboardingProgressDto = z.infer<
  typeof SaveOnboardingProgressDto
>;
