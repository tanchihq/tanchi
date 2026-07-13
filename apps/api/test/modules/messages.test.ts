import { beforeEach, describe, expect, it } from "bun:test";
import {
  authedRequest,
  createAccount,
  jsonRequest,
  request,
} from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";

const UNKNOWN_UUID = "00000000-0000-7000-8000-000000000000";

type SeedMessageInput = Readonly<{
  organizationId: string;
  status?: string;
  channel?: string;
  subject?: string | null;
  body?: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string;
  sentAt?: Date | null;
}>;

type SeededMessage = Readonly<{
  messageId: string;
  leadId: string;
  companyId: string;
}>;

const seedMessage = async (
  input: SeedMessageInput
): Promise<SeededMessage> => {
  const companyId = Bun.randomUUIDv7();
  const leadId = Bun.randomUUIDv7();
  const messageId = Bun.randomUUIDv7();
  await db`
    INSERT INTO companies (id, organization_id, name)
    VALUES (${companyId}, ${input.organizationId}, ${input.companyName ?? "Acme Corp"})
  `;
  await db`
    INSERT INTO leads (id, organization_id, company_id, first_name, last_name)
    VALUES (
      ${leadId}, ${input.organizationId}, ${companyId},
      ${input.firstName ?? "Jane"}, ${input.lastName ?? "Doe"}
    )
  `;
  await db`
    INSERT INTO messages (id, organization_id, lead_id, channel, subject, body, status, sent_at)
    VALUES (
      ${messageId}, ${input.organizationId}, ${leadId},
      ${input.channel ?? "email"}, ${input.subject ?? "Hello"},
      ${input.body ?? "Original AI body"}, ${input.status ?? "draft"},
      ${input.sentAt ?? null}
    )
  `;
  return { messageId, leadId, companyId };
};

const seedOutcome = async (
  organizationId: string,
  messageId: string,
  leadId: string,
  classification: string
): Promise<void> => {
  await db`
    INSERT INTO outcomes (id, organization_id, message_id, lead_id, stage_signal, classification)
    VALUES (
      ${Bun.randomUUIDv7()}, ${organizationId}, ${messageId}, ${leadId},
      'replied', ${classification}
    )
  `;
};

const readMessageBody = async (id: string): Promise<string | null> => {
  const rows = await db<ReadonlyArray<Readonly<{ body: string }>>>`
    SELECT body FROM messages WHERE id = ${id}
  `;
  return rows[0]?.body ?? null;
};

beforeEach(truncateAll);

describe("messages GET /: history contract", () => {
  it("returns the persisted MessageHistoryDto fields for the caller's org", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      subject: "Quick question",
      body: "Hi Jane, could we talk?",
      firstName: "Jane",
      lastName: "Doe",
      companyName: "Globex",
    });

    const res = await authedRequest("/api/v1/messages", account.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ReadonlyArray<
      Readonly<Record<string, unknown>>
    >;
    expect(body.length).toBe(1);
    const row = body[0] as Readonly<Record<string, unknown>>;
    expect(row.id).toBe(seeded.messageId);
    expect(row.leadId).toBe(seeded.leadId);
    expect(row.prospectName).toBe("Jane Doe");
    expect(row.company).toBe("Globex");
    expect(row.channel).toBe("email");
    expect(row.subject).toBe("Quick question");
    expect(row.body).toBe("Hi Jane, could we talk?");
    expect(row.status).toBe("draft");
    expect(row.sentAt).toBeNull();
    expect(row.replyClassification).toBeNull();
    expect(typeof row.createdAt).toBe("string");
  });

  it("surfaces the latest outcome classification as replyClassification", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      status: "sent",
    });
    await seedOutcome(
      account.organizationId,
      seeded.messageId,
      seeded.leadId,
      "positive"
    );

    const res = await authedRequest("/api/v1/messages", account.cookie);
    const body = (await res.json()) as ReadonlyArray<
      Readonly<{ replyClassification: string | null }>
    >;
    expect(body[0]?.replyClassification).toBe("positive");
  });

  it("filters by status", async () => {
    const account = await createAccount();
    await seedMessage({ organizationId: account.organizationId, status: "draft" });
    await seedMessage({ organizationId: account.organizationId, status: "sent" });

    const res = await authedRequest(
      "/api/v1/messages?status=sent",
      account.cookie
    );
    const body = (await res.json()) as ReadonlyArray<
      Readonly<{ status: string }>
    >;
    expect(body.length).toBe(1);
    expect(body[0]?.status).toBe("sent");
  });

  it("filters by leadId", async () => {
    const account = await createAccount();
    const first = await seedMessage({ organizationId: account.organizationId });
    await seedMessage({ organizationId: account.organizationId });

    const res = await authedRequest(
      `/api/v1/messages?leadId=${first.leadId}`,
      account.cookie
    );
    const body = (await res.json()) as ReadonlyArray<
      Readonly<{ id: string }>
    >;
    expect(body.length).toBe(1);
    expect(body[0]?.id).toBe(first.messageId);
  });

  it("caps the number of rows at the requested limit", async () => {
    const account = await createAccount();
    await seedMessage({ organizationId: account.organizationId });
    await seedMessage({ organizationId: account.organizationId });
    await seedMessage({ organizationId: account.organizationId });

    const res = await authedRequest(
      "/api/v1/messages?limit=2",
      account.cookie
    );
    const body = (await res.json()) as ReadonlyArray<unknown>;
    expect(body.length).toBe(2);
  });
});

describe("messages GET /: query validation enforces declared bounds", () => {
  it("rejects an out-of-enum status (400)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/messages?status=archived",
      account.cookie
    );
    expect(res.status).toBe(400);
  });

  it("rejects a non-uuid leadId (400)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/messages?leadId=not-a-uuid",
      account.cookie
    );
    expect(res.status).toBe(400);
  });

  it("rejects a limit below MIN=1 (400)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/messages?limit=0",
      account.cookie
    );
    expect(res.status).toBe(400);
  });

  it("rejects a limit above MESSAGES_MAX_LIMIT=500 (400)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/messages?limit=501",
      account.cookie
    );
    expect(res.status).toBe(400);
  });

  it("rejects a non-integer limit (400)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/messages?limit=1.5",
      account.cookie
    );
    expect(res.status).toBe(400);
  });
});

describe("messages: multi-tenant isolation (product invariant #1)", () => {
  it("never lists another organization's messages", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await seedMessage({
      organizationId: owner.organizationId,
      body: "SECRET-OWNER-CONTENT",
      firstName: "Owner",
      lastName: "Person",
      companyName: "OwnerCo",
    });

    const res = await authedRequest("/api/v1/messages", other.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ReadonlyArray<unknown>;
    expect(body.length).toBe(0);
    expect(JSON.stringify(body)).not.toContain("SECRET-OWNER-CONTENT");
    expect(JSON.stringify(body)).not.toContain("OwnerCo");
  });

  it("refuses to edit a message owned by another organization (403 notInMyOrg) and leaves it unchanged", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const seeded = await seedMessage({
      organizationId: owner.organizationId,
      body: "Original AI body",
    });

    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      attacker.cookie,
      "PATCH",
      { body: "Hijacked body" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");
    expect(await readMessageBody(seeded.messageId)).toBe("Original AI body");
  });
});

describe("messages: authentication is required on every route", () => {
  it("rejects unauthenticated list (401)", async () => {
    expect((await request("/api/v1/messages")).status).toBe(401);
  });

  it("rejects unauthenticated edit (401)", async () => {
    const res = await jsonRequest(
      `/api/v1/messages/${UNKNOWN_UUID}`,
      null,
      "PATCH",
      { body: "whatever" }
    );
    expect(res.status).toBe(401);
  });
});

describe("messages PATCH /:id: edit lifecycle", () => {
  it("edits a draft (200), returns status 'edited' and the new content", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      subject: "Old subject",
      body: "Original AI body",
    });

    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { subject: "New subject", body: "Human edited body" }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Readonly<{
      id: string;
      subject: string | null;
      body: string;
      status: string;
    }>;
    expect(body.id).toBe(seeded.messageId);
    expect(body.subject).toBe("New subject");
    expect(body.body).toBe("Human edited body");
    expect(body.status).toBe("edited");
  });

  it("keeps the existing subject when subject is omitted", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      subject: "Keep me",
      body: "Original AI body",
    });

    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { body: "Edited body only" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).subject).toBe("Keep me");
  });

  it("sets the subject to null when null is sent explicitly", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      subject: "Had a subject",
      body: "Original AI body",
    });

    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { subject: null, body: "Edited body" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).subject).toBeNull();
  });

  it("captures the human edit as a preference pair (learning loop invariant #2)", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      body: "AI wrote this",
    });

    await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { body: "Human rewrote this" }
    );

    const edits = await db<
      ReadonlyArray<Readonly<{ ai_version: string; edited_version: string }>>
    >`
      SELECT ai_version, edited_version FROM edits WHERE message_id = ${seeded.messageId}
    `;
    expect(edits.length).toBe(1);
    expect(edits[0]?.ai_version).toBe("AI wrote this");
    expect(edits[0]?.edited_version).toBe("Human rewrote this");
  });

  it("allows re-editing an already edited message", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      status: "edited",
      body: "Original AI body",
    });

    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { body: "Second human edit" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("edited");
  });
});

describe("messages PATCH /:id: input validation enforces the declared DTO bounds", () => {
  it("rejects a malformed message id (400 invalidMessageId)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      "/api/v1/messages/not-a-uuid",
      account.cookie,
      "PATCH",
      { body: "valid body" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidMessageId");
  });

  it("rejects a missing body (400 invalidBody)", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
    });
    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { subject: "no body" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidBody");
  });

  it("rejects a blank body after trim (400 invalidBody)", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
    });
    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { body: "   " }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidBody");
  });

  it("rejects a body above MAX_BODY_LENGTH=20000 (400 invalidBody)", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
    });
    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { body: "x".repeat(20001) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidBody");
  });

  it("rejects a subject above MAX_SUBJECT_LENGTH=500 (400 invalidSubject)", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
    });
    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { subject: "x".repeat(501), body: "valid body" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidSubject");
  });
});

describe("messages PATCH /:id: business rules", () => {
  it("returns 404 inexistingMessage for an unknown id", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      `/api/v1/messages/${UNKNOWN_UUID}`,
      account.cookie,
      "PATCH",
      { body: "valid body" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingMessage");
  });

  it("refuses to edit a sent message (422 notEditable)", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      status: "sent",
    });
    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { body: "trying to edit a sent message" }
    );
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("notEditable");
  });

  it("refuses to edit a skipped message (422 notEditable)", async () => {
    const account = await createAccount();
    const seeded = await seedMessage({
      organizationId: account.organizationId,
      status: "skipped",
    });
    const res = await jsonRequest(
      `/api/v1/messages/${seeded.messageId}`,
      account.cookie,
      "PATCH",
      { body: "trying to edit a skipped message" }
    );
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("notEditable");
  });
});
