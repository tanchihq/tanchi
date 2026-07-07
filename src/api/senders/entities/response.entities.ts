import { type SenderStatus } from '@/api/shared/enums';

export type SenderDto = Readonly<{
  id: string;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  dailyCap: number;
  signature: string;
  status: SenderStatus;
  warmupStartedAt: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;
