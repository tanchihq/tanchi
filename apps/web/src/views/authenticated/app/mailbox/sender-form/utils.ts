import { z } from 'zod';
import { senderFieldsShape } from '../sender-fields/utils';

export const senderSchema = z.object({
  ...senderFieldsShape,
  secret: z.string().min(1, 'Required.').max(1024),
});

export type SenderFormValues = z.infer<typeof senderSchema>;

export const DEFAULT_SENDER_VALUES: SenderFormValues = {
  fromName: '',
  fromEmail: '',
  smtpHost: '',
  smtpPort: 465,
  smtpSecure: true,
  imapHost: '',
  imapPort: 993,
  imapSecure: true,
  username: '',
  secret: '',
  dailyCap: 30,
  signature: '',
};
