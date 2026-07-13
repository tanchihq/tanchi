import { beforeAll, describe, expect, it } from "bun:test";
import type { SendersService as SendersServiceClass } from "../../src/modules/senders/senders.service.ts";
import type { SendersRepository } from "../../src/modules/senders/repository/senders/senders.repository.ts";
import type { PgSender } from "../../src/modules/senders/repository/senders/senders.entities.ts";
import type { UpdateSenderDto } from "../../src/modules/senders/dto/request/update-sender.request.ts";
import {
  DeleteSenderErrors,
  TestSenderErrors,
  UpdateSenderErrors,
} from "../../src/modules/senders/senders.errors.ts";

process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/tanchi_test";
process.env.AUTH_SECRET ??= "test-auth-secret-that-is-long-enough-000";
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32).toString("base64");

const MY_ORG = "org-A";
const OTHER_ORG = "org-B";
const EMPTY_UPDATE: UpdateSenderDto = {};

const senderOwnedBy = (organizationId: string): PgSender => ({
  id: "sender-1",
  organization_id: organizationId,
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
  signature: "",
  warmup_started_at: null,
  status: "active",
  last_verified_at: null,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
});

const repositoryReturning = (sender: PgSender | null): SendersRepository => {
  const double = {
    getOneSenderById: (): Promise<PgSender | null> => Promise.resolve(sender),
  };
  return double as unknown as SendersRepository;
};

type SendersServiceCtor = new (
  repository: SendersRepository
) => SendersServiceClass;

let SendersService: SendersServiceCtor;

beforeAll(async () => {
  const module = (await import(
    "../../src/modules/senders/senders.service.ts"
  )) as { SendersService: SendersServiceCtor };
  SendersService = module.SendersService;
});

describe("SendersService tenant isolation", () => {
  it("refuses to update a sender owned by another org", async () => {
    const service = new SendersService(
      repositoryReturning(senderOwnedBy(OTHER_ORG))
    );
    expect(await service.updateSender("sender-1", EMPTY_UPDATE, MY_ORG)).toBe(
      UpdateSenderErrors.notInMyOrg
    );
  });

  it("refuses to delete a sender owned by another org", async () => {
    const service = new SendersService(
      repositoryReturning(senderOwnedBy(OTHER_ORG))
    );
    expect(await service.deleteSender("sender-1", MY_ORG)).toBe(
      DeleteSenderErrors.notInMyOrg
    );
  });

  it("refuses to test a sender owned by another org", async () => {
    const service = new SendersService(
      repositoryReturning(senderOwnedBy(OTHER_ORG))
    );
    expect(await service.testSender("sender-1", MY_ORG)).toBe(
      TestSenderErrors.notInMyOrg
    );
  });

  it("reports an inexisting sender when none is found", async () => {
    const service = new SendersService(repositoryReturning(null));
    expect(await service.deleteSender("missing", MY_ORG)).toBe(
      DeleteSenderErrors.inexistingSender
    );
  });

  it("refuses any operation without an active organization", async () => {
    const service = new SendersService(
      repositoryReturning(senderOwnedBy(MY_ORG))
    );
    expect(await service.deleteSender("sender-1", null)).toBe(
      DeleteSenderErrors.noActiveOrganization
    );
  });
});
