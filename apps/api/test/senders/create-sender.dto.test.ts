import { describe, expect, it } from "bun:test";
import { CreateSenderDto } from "../../src/modules/senders/dto/request/create-sender.request.ts";
import { CreateSenderErrors } from "../../src/modules/senders/senders.errors.ts";

const validInput = {
  fromName: "Jane Doe",
  fromEmail: "jane@acme.test",
  smtpHost: "smtp.acme.test",
  smtpPort: 587,
  smtpSecure: false,
  imapHost: "imap.acme.test",
  imapPort: 993,
  imapSecure: true,
  username: "jane",
  secret: "app-password",
};

const firstIssueMessage = (input: unknown): string | undefined => {
  const parsed = CreateSenderDto.safeParse(input);
  return parsed.success ? undefined : parsed.error.issues[0]?.message;
};

describe("CreateSenderDto", () => {
  it("accepts a valid payload and applies defaults", () => {
    const parsed = CreateSenderDto.safeParse(validInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dailyCap).toBe(30);
      expect(parsed.data.signature).toBe("");
    }
  });

  it("rejects an out-of-range port with the invalidPort error", () => {
    expect(firstIssueMessage({ ...validInput, smtpPort: 0 })).toBe(
      CreateSenderErrors.invalidPort
    );
    expect(firstIssueMessage({ ...validInput, imapPort: 70000 })).toBe(
      CreateSenderErrors.invalidPort
    );
  });

  it("rejects a malformed email with the invalidFromEmail error", () => {
    expect(firstIssueMessage({ ...validInput, fromEmail: "not-an-email" })).toBe(
      CreateSenderErrors.invalidFromEmail
    );
  });

  it("rejects a daily cap above the maximum", () => {
    expect(firstIssueMessage({ ...validInput, dailyCap: 5000 })).toBe(
      CreateSenderErrors.invalidDailyCap
    );
  });

  it("rejects an empty from name", () => {
    expect(firstIssueMessage({ ...validInput, fromName: "   " })).toBe(
      CreateSenderErrors.invalidFromName
    );
  });
});
