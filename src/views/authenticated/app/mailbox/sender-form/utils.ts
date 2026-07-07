import { z } from 'zod';

export const senderSchema = z.object({
  fromName: z.string().trim().min(1, 'Required.').max(200),
  fromEmail: z.email('Invalid email.').max(255),
  smtpHost: z.string().trim().min(1, 'Required.').max(255),
  smtpPort: z.number('Invalid port.').int().min(1).max(65535),
  smtpSecure: z.boolean(),
  imapHost: z.string().trim().min(1, 'Required.').max(255),
  imapPort: z.number('Invalid port.').int().min(1).max(65535),
  imapSecure: z.boolean(),
  username: z.string().trim().min(1, 'Required.').max(255),
  secret: z.string().min(1, 'Required.').max(1024),
  dailyCap: z.number('Invalid cap.').int().min(1).max(1000),
  signature: z.string().max(2000),
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
