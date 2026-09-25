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

const seedSentMessage = async (
  input: Readonly<{
    organizationId: string;
    leadId: string;
    subject: string;
    body: string;
    emailMessageId: string | null;
    senderId?: string | null;
  }>
): Promise<void> => {
  await db`
    INSERT INTO messages (
      id, organization_id, lead_id, channel, subject, body, status, sent_at,
      email_message_id, sender_id
    )
    VALUES (
      ${Bun.randomUUIDv7()}, ${input.organizationId}, ${input.leadId}, 'email',
      ${input.subject}, ${input.body}, 'sent', NOW() - INTERVAL '4 days',
      ${input.emailMessageId}, ${input.senderId ?? null}
    )
  `;
  await db`
    UPDATE leads SET sequence_step = 1, stage = 'following-up' WHERE id = ${input.leadId}
  `;
};

const seedAngle = async (
  input: Readonly<{ organizationId: string; leadId: string; ranks: ReadonlyArray<number>; chosenRank: number }>
): Promise<void> => {
  const dossierId = Bun.randomUUIDv7();
  const factId = Bun.randomUUIDv7();
  await db`
    INSERT INTO dossiers (id, organization_id, lead_id)
    VALUES (${dossierId}, ${input.organizationId}, ${input.leadId})
  `;
  await db`
    INSERT INTO dossier_facts (id, dossier_id, text, source_url)
    VALUES (${factId}, ${dossierId}, 'Opened a second venue last week.', 'https://globex.test/news')
  `;
  await Promise.all(
    input.ranks.map((rank) => db`
      INSERT INTO dossier_angles (id, dossier_id, rank, title, note, fact_id, chosen)
      VALUES (
        ${Bun.randomUUIDv7()}, ${dossierId}, ${rank}, ${`Angle ${rank}`},
        ${`Note ${rank}`}, ${factId}, ${rank === input.chosenRank}
      )
    `)
  );
};

const chosenAngleRank = async (leadId: string): Promise<number | null> => {
  const rows = await db<ReadonlyArray<Readonly<{ rank: number }>>>`
    SELECT da.rank FROM dossier_angles da
    JOIN dossiers d ON d.id = da.dossier_id
    WHERE d.lead_id = ${leadId} AND da.chosen
  `;
  return rows[0]?.rank ?? null;
};

const leadState = async (leadId: string) => {
  const rows = await db<
    ReadonlyArray<Readonly<{ stage: string; excluded_at: Date | null }>>
  >`SELECT stage, excluded_at FROM leads WHERE id = ${leadId}`;
  return rows[0];
};

const skipReason = async (messageId: string): Promise<string | null> => {
  const rows = await db<ReadonlyArray<Readonly<{ skip_reason: string | null }>>>`
    SELECT skip_reason FROM messages WHERE id = ${messageId}
  `;
  return rows[0]?.skip_reason ?? null;
};

describe("queue: swipe card context", () => {
  it("describes a follow-up with the previous message it answers", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      subject: "Re: votre billetterie",
      body: "Petite relance.",
    });
    await seedSentMessage({
      organizationId: account.organizationId,
      leadId: seed.leadId,
      subject: "votre billetterie",
      body: "Premier message.",
      emailMessageId: "<first@sender.test>",
    });

    const body = await (await authedRequest("/api/v1/queue", account.cookie)).json();
    const item = body.items[0];
    expect(item.kind).toBe("follow-up");
    expect(item.followUpNumber).toBe(1);
    expect(item.previousMessage.subject).toBe("votre billetterie");
    expect(item.previousMessage.body).toBe("Premier message.");
    expect(item.previousMessage.sentAt).toBeString();
  });

  it("exposes the chosen angle with its sourced fact", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({ organizationId: account.organizationId });
    await seedAngle({
      organizationId: account.organizationId,
      leadId: seed.leadId,
      ranks: [1, 2],
      chosenRank: 1,
    });

    const body = await (await authedRequest("/api/v1/queue", account.cookie)).json();
    const item = body.items[0];
    expect(item.kind).toBe("first-touch");
    expect(item.previousMessage).toBeNull();
    expect(item.chosenAngle).toEqual({
      title: "Angle 1",
      note: "Note 1",
      fact: { text: "Opened a second venue last week.", sourceUrl: "https://globex.test/news" },
    });
  });

  it("flags email items as automatic only when autopilot is on", async () => {
    const account = await createAccount();
    await db`
      INSERT INTO organization_profile (organization_id, website, autopilot_enabled)
      VALUES (${account.organizationId}, 'https://acme.test', TRUE)
    `;
    await seedQueueItem({ organizationId: account.organizationId, channel: "email" });
    await seedQueueItem({ organizationId: account.organizationId, channel: "linkedin" });

    const body = await (await authedRequest("/api/v1/queue", account.cookie)).json();
    expect(body.autopilotEnabled).toBe(true);
    expect(body.items.map((item: Readonly<{ channel: string; autoSend: boolean }>) => [item.channel, item.autoSend])).toEqual([
      ["email", true],
      ["linkedin", false],
    ]);
  });

  it("hides drafts of leads that already replied or bounced", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({ organizationId: account.organizationId });
    await db`UPDATE leads SET stage = 'replied' WHERE id = ${seed.leadId}`;
    const body = await (await authedRequest("/api/v1/queue", account.cookie)).json();
    expect(body.items).toEqual([]);
  });
});

describe("queue: validate threads the email", () => {
  it("stores the Message-ID returned by the mailbox", async () => {
    const account = await createAccount();
    await seedActiveSender(account.organizationId);
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      email: "prospect@lead.test",
    });

    await authedRequest(`/api/v1/queue/${seed.leadId}/validate`, account.cookie, {
      method: "POST",
    });
    const rows = await db<ReadonlyArray<Readonly<{ email_message_id: string | null; send_claimed_at: Date | null }>>>`
      SELECT email_message_id, send_claimed_at FROM messages WHERE id = ${seed.messageId}
    `;
    expect(rows[0]?.email_message_id).toBe("mock-message-id");
    expect(rows[0]?.send_claimed_at).toBeNull();
  });

  it("refuses to send a draft another process is already sending", async () => {
    const account = await createAccount();
    await seedActiveSender(account.organizationId);
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      email: "prospect@lead.test",
    });
    await db`UPDATE messages SET send_claimed_at = NOW() WHERE id = ${seed.messageId}`;

    const res = await authedRequest(`/api/v1/queue/${seed.leadId}/validate`, account.cookie, {
      method: "POST",
    });
    expect(res.status).toBe(404);
    expect(await messageStatus(seed.messageId)).toBe("draft");
  });
});

describe("queue: skip (swipe left)", () => {
  it("skips without a reason and lets the engine redraft", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({ organizationId: account.organizationId });

    const res = await jsonRequest(`/api/v1/queue/${seed.leadId}/skip`, account.cookie, "POST", {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: seed.leadId,
      messageId: seed.messageId,
      reason: null,
      nextStep: "redraft",
    });
    expect(await messageStatus(seed.messageId)).toBe("skipped");
    expect((await leadState(seed.leadId))?.stage).toBe("identified");
  });

  it("wrong lead: excludes the person and hides the lead", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({
      organizationId: account.organizationId,
      email: "Wrong@Lead.test",
    });

    const res = await jsonRequest(`/api/v1/queue/${seed.leadId}/skip`, account.cookie, "POST", {
      reason: "wrong_lead",
    });
    expect((await res.json()).nextStep).toBe("excluded");
    expect(await skipReason(seed.messageId)).toBe("wrong_lead");
    expect((await leadState(seed.leadId))?.excluded_at).not.toBeNull();
    const exclusions = await db<ReadonlyArray<Readonly<{ email: string }>>>`
      SELECT email FROM exclusions WHERE organization_id = ${account.organizationId}
    `;
    expect(exclusions.map((row) => row.email)).toEqual(["wrong@lead.test"]);
  });

  it("not now: snoozes the lead", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({ organizationId: account.organizationId });
    const res = await jsonRequest(`/api/v1/queue/${seed.leadId}/skip`, account.cookie, "POST", {
      reason: "not_now",
    });
    expect((await res.json()).nextStep).toBe("snoozed");
    expect((await leadState(seed.leadId))?.stage).toBe("snoozed");
  });

  it("wrong angle: moves the chosen angle to the next one", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({ organizationId: account.organizationId });
    await seedAngle({
      organizationId: account.organizationId,
      leadId: seed.leadId,
      ranks: [1, 2, 3],
      chosenRank: 1,
    });

    await jsonRequest(`/api/v1/queue/${seed.leadId}/skip`, account.cookie, "POST", {
      reason: "wrong_angle",
    });
    expect(await chosenAngleRank(seed.leadId)).toBe(2);
    expect(await skipReason(seed.messageId)).toBe("wrong_angle");
  });

  it("rejects an unknown reason (400 invalidReason)", async () => {
    const account = await createAccount();
    const seed = await seedQueueItem({ organizationId: account.organizationId });
    const res = await jsonRequest(`/api/v1/queue/${seed.leadId}/skip`, account.cookie, "POST", {
      reason: "because",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidReason");
    expect(await messageStatus(seed.messageId)).toBe("draft");
  });

  it("refuses to skip another organization's draft (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const intruder = await createAccount();
    const seed = await seedQueueItem({ organizationId: owner.organizationId });
    const res = await jsonRequest(`/api/v1/queue/${seed.leadId}/skip`, intruder.cookie, "POST", {
      reason: "wrong_lead",
    });
    expect(res.status).toBe(403);
    expect(await messageStatus(seed.messageId)).toBe("draft");
    expect((await leadState(seed.leadId))?.excluded_at).toBeNull();
  });

  it("requires authentication", async () => {
    const res = await jsonRequest(`/api/v1/queue/${UNKNOWN_UUID}/skip`, null, "POST", {});
    expect(res.status).toBe(401);
  });
});
