import { z } from 'zod';
import { type EditSenderDto } from '@/api/senders/entities/request.entities';
import { type SenderDto } from '@/api/senders/entities/response.entities';
import { senderFieldsShape } from '../sender-fields/utils';

export const editSenderSchema = z.object({
  ...senderFieldsShape,
  secret: z.string().max(1024),
});

export type EditSenderFormValues = z.infer<typeof editSenderSchema>;

export const buildEditDefaults = (sender: SenderDto): EditSenderFormValues => ({
  fromName: sender.fromName,
  fromEmail: sender.fromEmail,
  smtpHost: sender.smtpHost,
  smtpPort: sender.smtpPort,
  smtpSecure: sender.smtpSecure,
  imapHost: sender.imapHost,
  imapPort: sender.imapPort,
  imapSecure: sender.imapSecure,
  username: sender.username,
  secret: '',
  dailyCap: sender.dailyCap,
  signature: sender.signature,
});

type DirtyFields = Partial<Record<keyof EditSenderFormValues, boolean | undefined>>;

export const buildEditPayload = (
  values: EditSenderFormValues,
  dirtyFields: DirtyFields,
): EditSenderDto => ({
  ...(dirtyFields.fromName ? { fromName: values.fromName } : {}),
  ...(dirtyFields.fromEmail ? { fromEmail: values.fromEmail } : {}),
  ...(dirtyFields.smtpHost ? { smtpHost: values.smtpHost } : {}),
  ...(dirtyFields.smtpPort ? { smtpPort: values.smtpPort } : {}),
  ...(dirtyFields.smtpSecure ? { smtpSecure: values.smtpSecure } : {}),
  ...(dirtyFields.imapHost ? { imapHost: values.imapHost } : {}),
  ...(dirtyFields.imapPort ? { imapPort: values.imapPort } : {}),
  ...(dirtyFields.imapSecure ? { imapSecure: values.imapSecure } : {}),
  ...(dirtyFields.username ? { username: values.username } : {}),
  ...(dirtyFields.dailyCap ? { dailyCap: values.dailyCap } : {}),
  ...(dirtyFields.signature ? { signature: values.signature } : {}),
  ...(values.secret.length > 0 ? { secret: values.secret } : {}),
});
