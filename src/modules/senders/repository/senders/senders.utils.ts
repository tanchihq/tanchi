import type {
  CreateSenderFactoryInput,
  PgSenderFactory,
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
