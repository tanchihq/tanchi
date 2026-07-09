import { z } from 'zod';

export const SIGNATURE_MAX_LENGTH = 2000;

export const senderFieldsShape = {
  fromName: z.string().trim().min(1, 'Required.').max(200),
  fromEmail: z.email('Invalid email.').max(255),
  smtpHost: z.string().trim().min(1, 'Required.').max(255),
  smtpPort: z.number('Invalid port.').int().min(1).max(65535),
  smtpSecure: z.boolean(),
  imapHost: z.string().trim().min(1, 'Required.').max(255),
  imapPort: z.number('Invalid port.').int().min(1).max(65535),
  imapSecure: z.boolean(),
  username: z.string().trim().min(1, 'Required.').max(255),
  dailyCap: z.number('Invalid cap.').int().min(1).max(1000),
  signature: z
    .string()
    .max(SIGNATURE_MAX_LENGTH, `Signature is too long (${SIGNATURE_MAX_LENGTH} max).`),
};

export type SenderFieldsValues = {
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  secret: string;
  dailyCap: number;
  signature: string;
};
