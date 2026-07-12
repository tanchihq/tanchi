import { z } from "zod";
import { CreateSenderErrors } from "../../senders.errors.ts";
import {
  DEFAULT_DAILY_CAP,
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
  .number({ error: CreateSenderErrors.invalidPort })
  .int({ message: CreateSenderErrors.invalidPort })
  .min(MIN_PORT, { message: CreateSenderErrors.invalidPort })
  .max(MAX_PORT, { message: CreateSenderErrors.invalidPort });

const hostSchema = z
  .string({ error: CreateSenderErrors.invalidHost })
  .trim()
  .min(1, { message: CreateSenderErrors.invalidHost })
  .max(MAX_HOST_LENGTH, { message: CreateSenderErrors.invalidHost });

export const CreateSenderDto = z.object({
  fromName: z
    .string({ error: CreateSenderErrors.invalidFromName })
    .trim()
    .min(1, { message: CreateSenderErrors.invalidFromName })
    .max(MAX_FROM_NAME_LENGTH, {
      message: CreateSenderErrors.invalidFromName,
    }),
  fromEmail: z
    .email({ error: CreateSenderErrors.invalidFromEmail })
    .max(MAX_EMAIL_LENGTH, { message: CreateSenderErrors.invalidFromEmail }),
  smtpHost: hostSchema,
  smtpPort: portSchema,
  smtpSecure: z.boolean({ error: CreateSenderErrors.invalidPort }),
  imapHost: hostSchema,
  imapPort: portSchema,
  imapSecure: z.boolean({ error: CreateSenderErrors.invalidPort }),
  username: z
    .string({ error: CreateSenderErrors.invalidUsername })
    .trim()
    .min(1, { message: CreateSenderErrors.invalidUsername })
    .max(MAX_USERNAME_LENGTH, {
      message: CreateSenderErrors.invalidUsername,
    }),
  secret: z
    .string({ error: CreateSenderErrors.invalidSecret })
    .min(1, { message: CreateSenderErrors.invalidSecret })
    .max(MAX_SECRET_LENGTH, { message: CreateSenderErrors.invalidSecret }),
  dailyCap: z.coerce
    .number({ error: CreateSenderErrors.invalidDailyCap })
    .int({ message: CreateSenderErrors.invalidDailyCap })
    .min(MIN_DAILY_CAP, { message: CreateSenderErrors.invalidDailyCap })
    .max(MAX_DAILY_CAP, { message: CreateSenderErrors.invalidDailyCap })
    .default(DEFAULT_DAILY_CAP),
  signature: z
    .string({ error: CreateSenderErrors.invalidSignature })
    .max(MAX_SIGNATURE_LENGTH, {
      message: CreateSenderErrors.invalidSignature,
    })
    .default(""),
});

export type CreateSenderDto = z.infer<typeof CreateSenderDto>;
