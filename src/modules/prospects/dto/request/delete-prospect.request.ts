import { z } from "zod";
import { DeleteProspectErrors } from "../../prospects.errors.ts";
import { MAX_EXCLUSION_REASON_LENGTH } from "../../prospects.constants.ts";

export const DeleteProspectDto = z.object({
  scope: z.enum(["person", "company"], {
    error: DeleteProspectErrors.invalidScope,
  }),
  reason: z
    .string({ error: DeleteProspectErrors.invalidReason })
    .trim()
    .max(MAX_EXCLUSION_REASON_LENGTH, {
      message: DeleteProspectErrors.invalidReason,
    })
    .optional(),
});

export type DeleteProspectDto = z.infer<typeof DeleteProspectDto>;
