type PgSenderStatus = "unverified" | "active" | "error";

type PgSender = Readonly<{
  id: string;
  organization_id: string;
  from_name: string;
  from_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  username: string;
  secret_encrypted: string;
  daily_cap: number;
  signature: string;
  warmup_started_at: Date | null;
  status: PgSenderStatus;
  last_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}>;

type PgSenderFactory = Readonly<{
  id: string;
  organization_id: string;
  from_name: string;
  from_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  username: string;
  secret_encrypted: string;
  daily_cap: number;
  signature: string;
}>;

type CreateSenderFactoryInput = Readonly<{
  organizationId: string;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  secretEncrypted: string;
  dailyCap: number;
  signature: string;
}>;

type UpdateSenderVerificationInput = Readonly<{
  status: PgSenderStatus;
  lastVerifiedAt: Date | null;
}>;

type UpdateSenderInput = Readonly<{
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  secretEncrypted: string;
  dailyCap: number;
  signature: string;
  status: PgSenderStatus;
  lastVerifiedAt: Date | null;
}>;

type PgSenderUpdate = Readonly<{
  from_name: string;
  from_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  username: string;
  secret_encrypted: string;
  daily_cap: number;
  signature: string;
  status: PgSenderStatus;
  last_verified_at: Date | null;
}>;

export type {
  CreateSenderFactoryInput,
  PgSender,
  PgSenderFactory,
  PgSenderStatus,
  PgSenderUpdate,
  UpdateSenderInput,
  UpdateSenderVerificationInput,
};
