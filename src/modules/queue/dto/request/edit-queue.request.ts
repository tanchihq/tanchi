import { z } from "zod";
import { EditQueueErrors } from "../../queue.errors.ts";
import { MAX_MESSAGE_LENGTH } from "../../queue.constants.ts";

export const EditQueueDto = z.object({
  message: z
    .string({ error: EditQueueErrors.invalidMessage })
    .min(1, { message: EditQueueErrors.invalidMessage })
    .max(MAX_MESSAGE_LENGTH, { message: EditQueueErrors.invalidMessage }),
});

export type EditQueueDto = z.infer<typeof EditQueueDto>;
