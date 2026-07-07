import { z } from "zod";
import {
  MESSAGES_DEFAULT_LIMIT,
  MESSAGES_MAX_LIMIT,
} from "../../messages.constants.ts";

export const GetMessagesDto = z.object({
  status: z.enum(["draft", "edited", "sent", "skipped"]).optional(),
  leadId: z.uuid().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MESSAGES_MAX_LIMIT)
    .default(MESSAGES_DEFAULT_LIMIT),
});

export type GetMessagesDto = z.infer<typeof GetMessagesDto>;
