import { z } from "zod";
import { SendMessageErrors } from "../../chat.errors.ts";
import { MAX_CONTENT_LENGTH } from "../../chat.constants.ts";

export const SendMessageDto = z.object({
  content: z
    .string({ error: SendMessageErrors.invalidContent })
    .trim()
    .min(1, { message: SendMessageErrors.invalidContent })
    .max(MAX_CONTENT_LENGTH, { message: SendMessageErrors.invalidContent }),
});

export type SendMessageDto = z.infer<typeof SendMessageDto>;
