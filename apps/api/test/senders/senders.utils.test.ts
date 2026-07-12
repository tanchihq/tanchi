import { describe, expect, it } from "bun:test";
import { convertPgSenderToSenderDto } from "../../src/modules/senders/senders.utils.ts";
import type { PgSender } from "../../src/modules/senders/repository/senders/senders.entities.ts";

const basePgSender: PgSender = {
  id: "sender-1",
  organization_id: "org-1",
  from_name: "Jane Doe",
  from_email: "jane@acme.test",
  smtp_host: "smtp.acme.test",
  smtp_port: 587,
  smtp_secure: false,
  imap_host: "imap.acme.test",
  imap_port: 993,
  imap_secure: true,
  username: "jane",
  secret_encrypted: "ciphertext",
  daily_cap: 30,
  signature: "Best, Jane",
  warmup_started_at: new Date("2026-01-02T03:04:05.000Z"),
  status: "active",
  last_verified_at: new Date("2026-02-03T04:05:06.000Z"),
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-05T00:00:00.000Z"),
};

describe("convertPgSenderToSenderDto", () => {
  it("maps snake_case columns to camelCase fields", () => {
    const dto = convertPgSenderToSenderDto(basePgSender);
    expect(dto.fromName).toBe("Jane Doe");
    expect(dto.fromEmail).toBe("jane@acme.test");
    expect(dto.smtpHost).toBe("smtp.acme.test");
    expect(dto.imapSecure).toBe(true);
    expect(dto.dailyCap).toBe(30);
  });

  it("never leaks the encrypted secret into the DTO", () => {
    const dto = convertPgSenderToSenderDto(basePgSender);
    expect(Object.values(dto)).not.toContain("ciphertext");
    expect("secretEncrypted" in dto).toBe(false);
  });

  it("serialises dates to ISO strings", () => {
    const dto = convertPgSenderToSenderDto(basePgSender);
    expect(dto.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(dto.warmupStartedAt).toBe("2026-01-02T03:04:05.000Z");
    expect(dto.lastVerifiedAt).toBe("2026-02-03T04:05:06.000Z");
  });

  it("keeps nullable dates as null", () => {
    const dto = convertPgSenderToSenderDto({
      ...basePgSender,
      warmup_started_at: null,
      last_verified_at: null,
    });
    expect(dto.warmupStartedAt).toBeNull();
    expect(dto.lastVerifiedAt).toBeNull();
  });
});
