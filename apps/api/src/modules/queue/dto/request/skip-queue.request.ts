import { z } from "zod";
import { SkipQueueErrors } from "../../queue.errors.ts";
import { SKIP_REASONS } from "../../queue.constants.ts";

export const SkipQueueDto = z.object({
  reason: z
    .enum(SKIP_REASONS, { error: SkipQueueErrors.invalidReason })
    .nullable()
    .optional(),
});

export type SkipQueueDto = z.infer<typeof SkipQueueDto>;
