import { z } from "zod";
import { UpdateStageErrors } from "../../prospects.errors.ts";

export const UpdateStageDto = z.object({
  stage: z.enum(
    [
      "identified",
      "contacted",
      "following-up",
      "replied",
      "meeting",
      "won",
      "not-interested",
      "snoozed",
    ],
    { error: UpdateStageErrors.invalidStage }
  ),
  origin: z.enum(["auto", "manual"], {
    error: UpdateStageErrors.invalidOrigin,
  }),
});

export type UpdateStageDto = z.infer<typeof UpdateStageDto>;
