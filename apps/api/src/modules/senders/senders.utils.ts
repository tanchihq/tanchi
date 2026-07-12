import type { PgSender } from "./repository/senders/senders.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

export function convertPgSenderToSenderDto(
  sender: PgSender
): ResponseDto.SenderDto {
  return {
    id: sender.id,
    fromName: sender.from_name,
    fromEmail: sender.from_email,
    smtpHost: sender.smtp_host,
    smtpPort: sender.smtp_port,
    smtpSecure: sender.smtp_secure,
    imapHost: sender.imap_host,
    imapPort: sender.imap_port,
    imapSecure: sender.imap_secure,
    username: sender.username,
    dailyCap: sender.daily_cap,
    signature: sender.signature,
    status: sender.status,
    warmupStartedAt: sender.warmup_started_at?.toISOString() ?? null,
    lastVerifiedAt: sender.last_verified_at?.toISOString() ?? null,
    createdAt: sender.created_at.toISOString(),
    updatedAt: sender.updated_at.toISOString(),
  };
}
