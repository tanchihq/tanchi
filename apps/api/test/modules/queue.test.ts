import { beforeEach, describe, expect, it } from "bun:test";
import {
  authedRequest,
  createAccount,
  jsonRequest,
  request,
} from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";
import { encryptSecret } from "../../src/shared/crypto/index.ts";
import {
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
} from "../../src/modules/queue/queue.constants.ts";

const UNKNOWN_UUID = "00000000-0000-7000-8000-000000000000";

type SeedInput = Readonly<{
  organizationId: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  role?: string | null;
  email?: string | null;
  channel?: string;
  hot?: boolean;
  status?: string;
  subject?: string | null;
  body?: string;
  angleType?: string | null;
  createdAt?: string;
  fact?: Readonly<{ text: string; sourceUrl: string }>;
}>;

type SeedResult = Readonly<{
  leadId: string;
  messageId: string;
  companyId: string;
}>;

const seedQueueItem = async (input: SeedInput): Promise<SeedResult> => {
  const companyId = Bun.randomUUIDv7();
  const leadId = Bun.randomUUIDv7();
  const messageId = Bun.randomUUIDv7();
  const companyName = input.companyName ?? "Acme Corp";
  const channel = input.channel ?? "email";
  const status = input.status ?? "draft";
  const body = input.body ?? "Hello from the draft.";
  const createdAt = input.createdAt ?? new Date().toISOString();

  await db`
    INSERT INTO companies (id, organization_id, name)
    VALUES (${companyId}, ${input.organizationId}, ${companyName})
  `;
  await db`
    INSERT INTO leads (
      id, organization_id, company_id, first_name, last_name, role, email,
      channel, hot
    )
    VALUES (
      ${leadId}, ${input.organizationId}, ${companyId},
      ${input.firstName ?? "Jane"}, ${input.lastName ?? "Prospect"},
      ${input.role ?? "Head of Growth"}, ${input.email ?? "jane@lead.test"},
      ${channel}, ${input.hot ?? false}
    )
  `;
  await db`
    INSERT INTO messages (
      id, organization_id, lead_id, channel, subject, body, status,
      angle_type, created_at
    )
    VALUES (
      ${messageId}, ${input.organizationId}, ${leadId}, ${channel},
      ${input.subject ?? "A subject"}, ${body}, ${status},
      ${input.angleType ?? "curiosity"}, ${new Date(createdAt)}
    )
  `;

  if (input.fact !== undefined) {
    const dossierId = Bun.randomUUIDv7();
    await db`
      INSERT INTO dossiers (id, organization_id, lead_id)
      VALUES (${dossierId}, ${input.organizationId}, ${leadId})
    `;
    await db`
      INSERT INTO dossier_facts (id, dossier_id, text, source_url)
      VALUES (
        ${Bun.randomUUIDv7()}, ${dossierId}, ${input.fact.text},
        ${input.fact.sourceUrl}
      )
    `;
  }

  return { leadId, messageId, companyId };
};

const seedActiveSender = async (organizationId: string): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO senders (
      id, organization_id, from_name, from_email, smtp_host, smtp_port,
      smtp_secure, imap_host, imap_port, imap_secure, username,
      secret_encrypted, status, signature
    )
    VALUES (
      ${id}, ${organizationId}, 'Jane Sender', 'sender@acme.test',
      'smtp.acme.test', 587, false, 'imap.acme.test', 993, true, 'jane',
      ${encryptSecret("super-secret-password")}, 'active', ''
    )
  `;
  return id;
};

const messageStatus = async (messageId: string): Promise<string | null> => {
  const rows = await db<ReadonlyArray<Readonly<{ status: string }>>>`
    SELECT status FROM messages WHERE id = ${messageId}
  `;
  return rows[0]?.status ?? null;
};

const messageBody = async (messageId: string): Promise<string | null> => {
  const rows = await db<ReadonlyArray<Readonly<{ body: string }>>>`
    SELECT body FROM messages WHERE id = ${messageId}
  `;
  return rows[0]?.body ?? null;
};

beforeEach(truncateAll);

describe("queue: happy path and response contract", () => {
  it("returns the caller's drafts with the declared item shape", async () => {
    const account = await createAccount();
    await seedQueueItem({
      organizationId: account.organizationId,
      firstName: "Alice",
      lastName: "Doe",
      role: "CTO",
      companyName: "Globex",
      channel: "email",
      hot: true,
      subject: "Quick question",
      body: "Original body.",
      angleType: "pain-point",
    });

    const res = await authedRequest("/api/v1/queue", account.cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBe(1);
    const item = body.items[0];
    expect(item.firstName).toBe("Alice");
    expect(item.lastName).toBe("Doe");
    expect(item.role).toBe("CTO");
    expect(item.company).toBe("Globex");
    expect(item.channel).toBe("email");
    expect(item.hot).toBe(true);
    expect(item.done).toBe(false);
    expect(item.subject).toBe("Quick question");
    expect(item.angle).toBe("pain-point");
    expect(item.message).toBe("Original body.");
    expect(item.id).toBeString();
    expect(item.messageId).toBeString();
  });

  it("attaches sourced facts (text + sourceUrl) to a queue item", async () => {
    const account = await createAccount();
    await seedQueueItem({
      organizationId: account.organizationId,
      fact: {
        text: "Raised a Series B in 2025.",
        sourceUrl: "https://globex.test/news",
      },
    });

    const res = await authedRequest("/api/v1/queue", account.cookie);
    const body = await res.json();
    expect(body.items[0].facts).toEqual([
      { text: "Raised a Series B in 2025.", sourceUrl: "https://globex.test/news" },
    ]);
  });

  it("returns an empty queue with a null preparedAt when nothing is drafted", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/queue", account.cookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
    expect(body.preparedAt).toBeNull();
  });

  it("excludes messages whose status is not draft/edited", async () => {
    const account = await createAccount();
    await seedQueueItem({
      organizationId: account.organizationId,
      status: "sent",
    });
    const res = await authedRequest("/api/v1/queue", account.cookie);
    expect((await res.json()).items.length).toBe(0);
  });
});

describe("queue: input validation enforces the declared DTO bounds", () => {
  it("rejects an empty message on edit (400 invalidMessage)", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
    });
    const res = await jsonRequest(
      `/api/v1/queue/${seed.leadId}`,
      account.cookie,
      "PATCH",
      { message: "" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidMessage");
  });

  it("rejects a message longer than MAX_MESSAGE_LENGTH (400 invalidMessage)", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
    });
    const res = await jsonRequest(
      `/api/v1/queue/${seed.leadId}`,
      account.cookie,
      "PATCH",
      { message: "x".repeat(MAX_MESSAGE_LENGTH + 1) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidMessage");
  });

  it("rejects a subject longer than MAX_SUBJECT_LENGTH (400 invalidSubject)", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
    });
    const res = await jsonRequest(
      `/api/v1/queue/${seed.leadId}`,
      account.cookie,
      "PATCH",
      { message: "ok", subject: "s".repeat(MAX_SUBJECT_LENGTH + 1) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidSubject");
  });

  it("rejects a malformed lead id on edit (400 invalidProspectId)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      "/api/v1/queue/not-a-uuid",
      account.cookie,
      "PATCH",
      { message: "ok" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidProspectId");
  });

  it("rejects a malformed lead id on validate (400 invalidProspectId)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/queue/not-a-uuid/validate",
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidProspectId");
  });

  it("rejects a malformed senderId query on validate with 400, never 422", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
    });
    const res = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate?senderId=not-a-uuid`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(400);
  });
});

describe("queue: multi-tenant isolation (product invariant #1)", () => {
  it("lists only the queue items of the caller's active organization", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await seedQueueItem({
      organizationId: owner.organizationId,
      companyName: "OwnerCo",
    });
    await seedQueueItem({
      organizationId: owner.organizationId,
      companyName: "OwnerCo",
    });
    await seedQueueItem({
      organizationId: other.organizationId,
      companyName: "OtherCo",
    });

    const ownerRes = await authedRequest("/api/v1/queue", owner.cookie);
    const ownerBody = await ownerRes.json();
    expect(ownerBody.items.length).toBe(2);
    expect(JSON.stringify(ownerBody)).not.toContain("OtherCo");

    const otherRes = await authedRequest("/api/v1/queue", other.cookie);
    const otherBody = await otherRes.json();
    expect(otherBody.items.length).toBe(1);
    expect(JSON.stringify(otherBody)).not.toContain("OwnerCo");
  });

  it("refuses to edit a draft owned by another organization (403 notInMyOrg) and leaves it untouched", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const seed = await seedQueueItem({
      organizationId: owner.organizationId,
      body: "Untouched body.",
      email: "victim@owner.test",
    });

    const res = await jsonRequest(
      `/api/v1/queue/${seed.leadId}`,
      attacker.cookie,
      "PATCH",
      { message: "Hijacked message." }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");
    expect(await messageBody(seed.messageId)).toBe("Untouched body.");
  });

  it("does not leak the other org's data in the 403 edit body", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const seed = await seedQueueItem({
      organizationId: owner.organizationId,
      companyName: "SecretOwnerCo",
      email: "victim@owner.test",
      body: "Confidential draft.",
    });
    const res = await jsonRequest(
      `/api/v1/queue/${seed.leadId}`,
      attacker.cookie,
      "PATCH",
      { message: "hi" }
    );
    const text = await res.text();
    expect(text).not.toContain("SecretOwnerCo");
    expect(text).not.toContain("victim@owner.test");
    expect(text).not.toContain("Confidential draft.");
  });

  it("refuses to validate a draft owned by another organization (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const seed = await seedQueueItem({
      organizationId: owner.organizationId,
    });
    const res = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate`,
      attacker.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");
    expect(await messageStatus(seed.messageId)).toBe("draft");
  });

  it("cannot borrow another organization's sender via the senderId query (422 noSender)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const seed = await seedQueueItem({
      organizationId: attacker.organizationId,
      email: "prospect@lead.test",
    });
    const foreignSenderId = await seedActiveSender(owner.organizationId);
    const res = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate?senderId=${foreignSenderId}`,
      attacker.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("noSender");
    expect(await messageStatus(seed.messageId)).toBe("draft");
  });
});

describe("queue: edit lifecycle for the owning organization", () => {
  it("applies an edit (200) and reflects the new message and subject", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      body: "AI body.",
      subject: "AI subject",
    });
    const res = await jsonRequest(
      `/api/v1/queue/${seed.leadId}`,
      account.cookie,
      "PATCH",
      { message: "Human edited body.", subject: "Human subject" }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Human edited body.");
    expect(body.subject).toBe("Human subject");
    expect(body.done).toBe(false);
    expect(await messageStatus(seed.messageId)).toBe("edited");
  });

  it("accepts a null subject on edit (200)", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      subject: "Had a subject",
    });
    const res = await jsonRequest(
      `/api/v1/queue/${seed.leadId}`,
      account.cookie,
      "PATCH",
      { message: "New body.", subject: null }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).subject).toBeNull();
  });

  it("returns 404 inexistingDraft when editing an unknown lead", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      `/api/v1/queue/${UNKNOWN_UUID}`,
      account.cookie,
      "PATCH",
      { message: "ok" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingDraft");
  });
});

describe("queue: validate lifecycle for the owning organization", () => {
  it("sends an email draft, marks it done (200) and advances the message to sent", async () => {
    const account = await createAccount();
    await seedActiveSender(account.organizationId);
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      channel: "email",
      email: "prospect@lead.test",
    });
    const res = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).done).toBe(true);
    expect(await messageStatus(seed.messageId)).toBe("sent");
  });

  it("validates a non-email channel without a sender (200 done)", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      channel: "linkedin",
      email: null,
    });
    const res = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).done).toBe(true);
    expect(await messageStatus(seed.messageId)).toBe("sent");
  });

  it("returns 422 noSender when validating an email draft with no active sender", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      channel: "email",
      email: "prospect@lead.test",
    });
    const res = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("noSender");
    expect(await messageStatus(seed.messageId)).toBe("draft");
  });

  it("returns 404 inexistingDraft on a second validate of the same draft", async () => {
    const account = await createAccount();
    await seedActiveSender(account.organizationId);
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      channel: "email",
      email: "prospect@lead.test",
    });
    const first = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(first.status).toBe(200);
    const second = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(second.status).toBe(404);
    expect((await second.json()).message).toBe("inexistingDraft");
  });

  it("returns 404 inexistingDraft when validating an unknown lead", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/queue/${UNKNOWN_UUID}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingDraft");
  });
});

describe("queue: secret non-leakage (security invariant)", () => {
  it("never exposes sender credentials through queue responses", async () => {
    const account = await createAccount();
    await seedActiveSender(account.organizationId);
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      channel: "email",
      email: "prospect@lead.test",
    });

    const list = await authedRequest("/api/v1/queue", account.cookie);
    const listText = await list.text();
    expect(listText).not.toContain("super-secret-password");
    expect(listText).not.toContain("secret_encrypted");

    const validate = await authedRequest(
      `/api/v1/queue/${seed.leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    const validateText = await validate.text();
    expect(validateText).not.toContain("super-secret-password");
    expect(validateText).not.toContain("secret_encrypted");
  });
});

describe("queue: preparedAt reflects the caller's own most recent draft", () => {
  it("uses the newest org-scoped message timestamp, never another org's row", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await seedQueueItem({
      organizationId: other.organizationId,
      createdAt: "2030-01-01T00:00:00.000Z",
      companyName: "OtherCo",
    });
    await seedQueueItem({
      organizationId: owner.organizationId,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await seedQueueItem({
      organizationId: owner.organizationId,
      createdAt: "2026-06-01T00:00:00.000Z",
    });

    const res = await authedRequest("/api/v1/queue", owner.cookie);
    const body = await res.json();
    expect(body.preparedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(body.preparedAt).not.toBe("2030-01-01T00:00:00.000Z");
  });
});

describe("queue: authentication is required on every route", () => {
  it("rejects unauthenticated list, edit and validate (401)", async () => {
    expect((await request("/api/v1/queue")).status).toBe(401);
    const edit = await jsonRequest(
      `/api/v1/queue/${UNKNOWN_UUID}`,
      null,
      "PATCH",
      { message: "ok" }
    );
    expect(edit.status).toBe(401);
    const validate = await request(`/api/v1/queue/${UNKNOWN_UUID}/validate`, {
      method: "POST",
    });
    expect(validate.status).toBe(401);
  });
});
