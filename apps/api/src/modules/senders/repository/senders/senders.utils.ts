import type {
  CreateSenderFactoryInput,
  PgSenderFactory,
  PgSenderUpdate,
  UpdateSenderInput,
} from "./senders.entities.ts";

export function convertCreateSenderFactoryInputToPgSenderFactory(
  input: CreateSenderFactoryInput
): PgSenderFactory {
  return {
    id: Bun.randomUUIDv7(),
    organization_id: input.organizationId,
    from_name: input.fromName,
    from_email: input.fromEmail,
    smtp_host: input.smtpHost,
    smtp_port: input.smtpPort,
    smtp_secure: input.smtpSecure,
    imap_host: input.imapHost,
    imap_port: input.imapPort,
    imap_secure: input.imapSecure,
    username: input.username,
    secret_encrypted: input.secretEncrypted,
    daily_cap: input.dailyCap,
    signature: input.signature,
  };
}

export function convertUpdateSenderInputToPgSenderUpdate(
  input: UpdateSenderInput
): PgSenderUpdate {
  return {
    from_name: input.fromName,
    from_email: input.fromEmail,
    smtp_host: input.smtpHost,
    smtp_port: input.smtpPort,
    smtp_secure: input.smtpSecure,
    imap_host: input.imapHost,
    imap_port: input.imapPort,
    imap_secure: input.imapSecure,
    username: input.username,
    secret_encrypted: input.secretEncrypted,
    daily_cap: input.dailyCap,
    signature: input.signature,
    status: input.status,
    last_verified_at: input.lastVerifiedAt,
  };
}
