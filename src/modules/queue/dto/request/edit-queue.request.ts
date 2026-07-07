import { z } from "zod";
import { EditQueueErrors } from "../../queue.errors.ts";
import {
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
} from "../../queue.constants.ts";

export const EditQueueDto = z.object({
  message: z
    .string({ error: EditQueueErrors.invalidMessage })
    .min(1, { message: EditQueueErrors.invalidMessage })
    .max(MAX_MESSAGE_LENGTH, { message: EditQueueErrors.invalidMessage }),
  subject: z
    .string({ error: EditQueueErrors.invalidSubject })
    .max(MAX_SUBJECT_LENGTH, { message: EditQueueErrors.invalidSubject })
    .nullable()
    .optional(),
});

export type EditQueueDto = z.infer<typeof EditQueueDto>;
