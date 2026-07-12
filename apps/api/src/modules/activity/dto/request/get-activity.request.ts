import { z } from "zod";
import {
  ACTIVITY_DEFAULT_LIMIT,
  ACTIVITY_MAX_LIMIT,
} from "../../activity.constants.ts";

export const GetActivityDto = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ACTIVITY_MAX_LIMIT)
    .default(ACTIVITY_DEFAULT_LIMIT),
});

export type GetActivityDto = z.infer<typeof GetActivityDto>;
