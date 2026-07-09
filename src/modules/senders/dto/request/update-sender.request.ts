import { z } from "zod";
import { UpdateSenderErrors } from "../../senders.errors.ts";
import {
  MAX_DAILY_CAP,
  MAX_EMAIL_LENGTH,
  MAX_FROM_NAME_LENGTH,
  MAX_HOST_LENGTH,
  MAX_PORT,
  MAX_SECRET_LENGTH,
  MAX_SIGNATURE_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_DAILY_CAP,
  MIN_PORT,
} from "../../senders.constants.ts";

const portSchema = z.coerce
  .number({ error: UpdateSenderErrors.invalidPort })
  .int({ message: UpdateSenderErrors.invalidPort })
  .min(MIN_PORT, { message: UpdateSenderErrors.invalidPort })
  .max(MAX_PORT, { message: UpdateSenderErrors.invalidPort });

const hostSchema = z
  .string({ error: UpdateSenderErrors.invalidHost })
  .trim()
  .min(1, { message: UpdateSenderErrors.invalidHost })
  .max(MAX_HOST_LENGTH, { message: UpdateSenderErrors.invalidHost });

export const UpdateSenderDto = z.object({
  fromName: z
    .string({ error: UpdateSenderErrors.invalidFromName })
    .trim()
    .min(1, { message: UpdateSenderErrors.invalidFromName })
    .max(MAX_FROM_NAME_LENGTH, {
      message: UpdateSenderErrors.invalidFromName,
    })
    .optional(),
  fromEmail: z
    .email({ error: UpdateSenderErrors.invalidFromEmail })
    .max(MAX_EMAIL_LENGTH, { message: UpdateSenderErrors.invalidFromEmail })
    .optional(),
  smtpHost: hostSchema.optional(),
  smtpPort: portSchema.optional(),
  smtpSecure: z.boolean({ error: UpdateSenderErrors.invalidPort }).optional(),
  imapHost: hostSchema.optional(),
  imapPort: portSchema.optional(),
  imapSecure: z.boolean({ error: UpdateSenderErrors.invalidPort }).optional(),
  username: z
    .string({ error: UpdateSenderErrors.invalidUsername })
    .trim()
    .min(1, { message: UpdateSenderErrors.invalidUsername })
    .max(MAX_USERNAME_LENGTH, {
      message: UpdateSenderErrors.invalidUsername,
    })
    .optional(),
  secret: z
    .string({ error: UpdateSenderErrors.invalidSecret })
    .min(1, { message: UpdateSenderErrors.invalidSecret })
    .max(MAX_SECRET_LENGTH, { message: UpdateSenderErrors.invalidSecret })
    .optional(),
  dailyCap: z.coerce
    .number({ error: UpdateSenderErrors.invalidDailyCap })
    .int({ message: UpdateSenderErrors.invalidDailyCap })
    .min(MIN_DAILY_CAP, { message: UpdateSenderErrors.invalidDailyCap })
    .max(MAX_DAILY_CAP, { message: UpdateSenderErrors.invalidDailyCap })
    .optional(),
  signature: z
    .string({ error: UpdateSenderErrors.invalidSignature })
    .max(MAX_SIGNATURE_LENGTH, {
      message: UpdateSenderErrors.invalidSignature,
    })
    .optional(),
});

export type UpdateSenderDto = z.infer<typeof UpdateSenderDto>;
