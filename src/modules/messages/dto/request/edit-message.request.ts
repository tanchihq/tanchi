import { z } from "zod";
import { EditMessageErrors } from "../../messages.errors.ts";
import {
  MAX_BODY_LENGTH,
  MAX_SUBJECT_LENGTH,
} from "../../messages.constants.ts";

export const EditMessageDto = z.object({
  subject: z
    .string({ error: EditMessageErrors.invalidSubject })
    .max(MAX_SUBJECT_LENGTH, { message: EditMessageErrors.invalidSubject })
    .nullable()
    .optional(),
  body: z
    .string({ error: EditMessageErrors.invalidBody })
    .trim()
    .min(1, { message: EditMessageErrors.invalidBody })
    .max(MAX_BODY_LENGTH, { message: EditMessageErrors.invalidBody }),
});

export type EditMessageDto = z.infer<typeof EditMessageDto>;
