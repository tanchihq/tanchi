import { beforeEach, describe, expect, it } from "bun:test";
import {
  authedRequest,
  createAccount,
  jsonRequest,
  request,
} from "../helpers/client.ts";
import { truncateAll } from "../helpers/db.ts";

const validSenderPayload = () => ({
  fromName: "Jane Doe",
  fromEmail: "jane@acme.test",
  smtpHost: "smtp.acme.test",
  smtpPort: 587,
  smtpSecure: false,
  imapHost: "imap.acme.test",
  imapPort: 993,
  imapSecure: true,
  username: "jane",
  secret: "super-secret-password",
  dailyCap: 30,
  signature: "Best, Jane",
});

const createSender = async (cookie: string) => {
  const res = await jsonRequest(
    "/api/v1/senders",
    cookie,
    "POST",
    validSenderPayload()
  );
  expect(res.status).toBe(201);
  return (await res.json()) as Readonly<{ id: string; fromEmail: string }>;
};

beforeEach(truncateAll);

describe("senders: happy path and response contract", () => {
  it("creates a sender (201) and returns the persisted fields", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      "/api/v1/senders",
      account.cookie,
      "POST",
      validSenderPayload()
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeString();
    expect(body.fromEmail).toBe("jane@acme.test");
    expect(body.dailyCap).toBe(30);
  });

  it("never exposes the SMTP secret in any response (security invariant)", async () => {
    const account = await createAccount();
    const created = await jsonRequest(
      "/api/v1/senders",
      account.cookie,
      "POST",
      validSenderPayload()
    );
    const createdBody = await created.json();
    expect(createdBody).not.toHaveProperty("secret");
    expect(createdBody).not.toHaveProperty("secretEncrypted");
    expect(createdBody).not.toHaveProperty("secret_encrypted");
    expect(JSON.stringify(createdBody)).not.toContain("super-secret-password");

    const list = await authedRequest("/api/v1/senders", account.cookie);
    const listBody = await list.json();
    expect(JSON.stringify(listBody)).not.toContain("super-secret-password");
    expect(JSON.stringify(listBody)).not.toContain("secret_encrypted");
  });
});

describe("senders: input validation enforces the declared DTO bounds", () => {
  it("rejects a malformed email (400 invalidFromEmail)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/senders", account.cookie, "POST", {
      ...validSenderPayload(),
      fromEmail: "not-an-email",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidFromEmail");
  });

  it("rejects a port below MIN_PORT=1 (400 invalidPort)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/senders", account.cookie, "POST", {
      ...validSenderPayload(),
      smtpPort: 0,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidPort");
  });

  it("rejects a port above MAX_PORT=65535 (400 invalidPort)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/senders", account.cookie, "POST", {
      ...validSenderPayload(),
      imapPort: 65536,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidPort");
  });

  it("rejects a dailyCap above MAX_DAILY_CAP=1000 (400 invalidDailyCap)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/senders", account.cookie, "POST", {
      ...validSenderPayload(),
      dailyCap: 1001,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidDailyCap");
  });

  it("rejects a fromName longer than MAX_FROM_NAME_LENGTH=200 (400 invalidFromName)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/senders", account.cookie, "POST", {
      ...validSenderPayload(),
      fromName: "x".repeat(201),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidFromName");
  });

  it("rejects a malformed sender id on update (400 invalidSenderId)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      "/api/v1/senders/not-a-uuid",
      account.cookie,
      "PATCH",
      { fromName: "Bad" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidSenderId");
  });
});

describe("senders: multi-tenant isolation (product invariant #1)", () => {
  it("lists only the senders of the caller's active organization", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await createSender(owner.cookie);

    const ownerList = await authedRequest("/api/v1/senders", owner.cookie);
    expect((await ownerList.json()).length).toBe(1);

    const otherList = await authedRequest("/api/v1/senders", other.cookie);
    expect((await otherList.json()).length).toBe(0);
  });

  it("refuses to update a sender owned by another organization (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const sender = await createSender(owner.cookie);
    const res = await jsonRequest(
      `/api/v1/senders/${sender.id}`,
      attacker.cookie,
      "PATCH",
      { fromName: "Hijacked" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");
  });

  it("refuses to delete a sender owned by another organization (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const sender = await createSender(owner.cookie);
    const res = await authedRequest(
      `/api/v1/senders/${sender.id}`,
      attacker.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(403);
  });

  it("refuses to test a sender owned by another organization (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const sender = await createSender(owner.cookie);
    const res = await authedRequest(
      `/api/v1/senders/${sender.id}/test`,
      attacker.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(403);
  });
});

describe("senders: lifecycle for the owning organization", () => {
  it("updates a sender (200) and reflects the change", async () => {
    const account = await createAccount();
    const sender = await createSender(account.cookie);
    const res = await jsonRequest(
      `/api/v1/senders/${sender.id}`,
      account.cookie,
      "PATCH",
      { fromName: "Renamed" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).fromName).toBe("Renamed");
  });

  it("returns 404 for an unknown sender id", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      "/api/v1/senders/00000000-0000-7000-8000-000000000000",
      account.cookie,
      "PATCH",
      { fromName: "Ghost" }
    );
    expect(res.status).toBe(404);
  });

  it("deletes a sender (204) and it disappears from the list", async () => {
    const account = await createAccount();
    const sender = await createSender(account.cookie);
    const res = await authedRequest(
      `/api/v1/senders/${sender.id}`,
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(204);
    const list = await authedRequest("/api/v1/senders", account.cookie);
    expect((await list.json()).length).toBe(0);
  });

  it("marks a sender active after a healthy connection test (200)", async () => {
    const account = await createAccount();
    const sender = await createSender(account.cookie);
    const res = await authedRequest(
      `/api/v1/senders/${sender.id}/test`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("active");
  });
});

describe("senders: authentication is required on every route", () => {
  it("rejects unauthenticated list and create (401)", async () => {
    expect((await request("/api/v1/senders")).status).toBe(401);
    const create = await jsonRequest(
      "/api/v1/senders",
      null,
      "POST",
      validSenderPayload()
    );
    expect(create.status).toBe(401);
  });
});
