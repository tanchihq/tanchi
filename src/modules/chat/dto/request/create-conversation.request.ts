import { z } from "zod";
import { CreateConversationErrors } from "../../chat.errors.ts";
import { MAX_TITLE_LENGTH } from "../../chat.constants.ts";

export const CreateConversationDto = z.object({
  title: z
    .string({ error: CreateConversationErrors.invalidTitle })
    .trim()
    .max(MAX_TITLE_LENGTH, { message: CreateConversationErrors.invalidTitle })
    .optional(),
});

export type CreateConversationDto = z.infer<typeof CreateConversationDto>;
