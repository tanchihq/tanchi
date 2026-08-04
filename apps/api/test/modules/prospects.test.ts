import { beforeEach, describe, expect, it } from "bun:test";
import {
  authedRequest,
  createAccount,
  jsonRequest,
  request,
  type Account,
} from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";

const A_UUID = "00000000-0000-7000-8000-000000000000";

type SeedLeadInput = Readonly<{
  channel?: string;
  email?: string | null;
  stage?: string;
  sequenceStep?: number;
  companyId?: string | null;
  firstName?: string;
  lastName?: string;
}>;

const seedCompany = async (
  organizationId: string,
  name: string,
  domain: string
): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO companies (id, organization_id, name, domain, website, sector, size, hq)
    VALUES (${id}, ${organizationId}, ${name}, ${domain},
            ${`https://${domain}`}, 'SaaS', '11-50', 'Paris')
  `;
  return id;
};

const seedLead = async (
  organizationId: string,
  input: SeedLeadInput = {}
): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO leads (
      id, organization_id, company_id, first_name, last_name, email,
      channel, stage, sequence_step
    )
    VALUES (
      ${id}, ${organizationId}, ${input.companyId ?? null},
      ${input.firstName ?? "Ada"}, ${input.lastName ?? "Lovelace"},
      ${input.email ?? null}, ${input.channel ?? "email"},
      ${input.stage ?? "identified"}, ${input.sequenceStep ?? 0}
    )
  `;
  return id;
};

const seedDraft = async (
  organizationId: string,
  leadId: string,
  channel = "email"
): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO messages (id, organization_id, lead_id, channel, subject, body, status)
    VALUES (${id}, ${organizationId}, ${leadId}, ${channel},
            'Hello', 'Draft body', 'draft')
  `;
  return id;
};

const seedDossierWithFact = async (
  organizationId: string,
  leadId: string,
  sourceUrl: string
): Promise<void> => {
  const dossierId = Bun.randomUUIDv7();
  await db`
    INSERT INTO dossiers (id, organization_id, lead_id, summary)
    VALUES (${dossierId}, ${organizationId}, ${leadId}, 'Summary')
  `;
  await db`
    INSERT INTO dossier_facts (id, dossier_id, text, source_url)
    VALUES (${Bun.randomUUIDv7()}, ${dossierId}, 'Raised a Series A', ${sourceUrl})
  `;
  await db`
    INSERT INTO dossier_angles (id, dossier_id, rank, title, note, angle_type, chosen)
    VALUES (${Bun.randomUUIDv7()}, ${dossierId}, 1, 'Growth', 'note', 'pain', TRUE)
  `;
};

const activeSenderSecret = "super-secret-password";

const createActiveSender = async (account: Account): Promise<string> => {
  const created = await jsonRequest("/api/v1/senders", account.cookie, "POST", {
    fromName: "Jane Doe",
    fromEmail: "jane@acme.test",
    smtpHost: "smtp.acme.test",
    smtpPort: 587,
    smtpSecure: false,
    imapHost: "imap.acme.test",
    imapPort: 993,
    imapSecure: true,
    username: "jane",
    secret: activeSenderSecret,
    dailyCap: 30,
    signature: "Best, Jane",
  });
  expect(created.status).toBe(201);
  const sender = (await created.json()) as Readonly<{ id: string }>;
  const test = await authedRequest(
    `/api/v1/senders/${sender.id}/test`,
    account.cookie,
    { method: "POST" }
  );
  expect(test.status).toBe(200);
  return sender.id;
};

beforeEach(truncateAll);

describe("prospects: list happy path and response contract", () => {
  it("lists prospects (200) with the declared ProspectDto shape", async () => {
    const account = await createAccount();
    const companyId = await seedCompany(
      account.organizationId,
      "Acme Corp",
      "acme.test"
    );
    await seedLead(account.organizationId, {
      companyId,
      firstName: "Ada",
      lastName: "Lovelace",
    });

    const res = await authedRequest("/api/v1/prospects", account.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ReadonlyArray<
      Readonly<Record<string, unknown>>
    >;
    expect(body.length).toBe(1);
    const prospect = body[0];
    expect(prospect?.id).toBeString();
    expect(prospect?.firstName).toBe("Ada");
    expect(prospect?.lastName).toBe("Lovelace");
    expect(prospect?.company).toBe("Acme Corp");
    expect(prospect?.channel).toBe("email");
    expect(prospect?.stage).toBe("identified");
    expect(prospect?.origin).toBe("auto");
    expect(prospect?.hot).toBe(false);
    expect(prospect?.createdAt).toBeString();
    expect(prospect).toHaveProperty("nextFollowUpAt");
    expect(prospect).toHaveProperty("snoozeUntil");
  });

  it("excludes soft-deleted leads (excluded_at set) from the list", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    await db`UPDATE leads SET excluded_at = NOW() WHERE id = ${leadId}`;

    const res = await authedRequest("/api/v1/prospects", account.cookie);
    expect(res.status).toBe(200);
    expect(((await res.json()) as ReadonlyArray<unknown>).length).toBe(0);
  });
});

describe("prospects: detail happy path and product invariant #1", () => {
  it("returns the LeadDetailDto shape (200) with a sourced fact", async () => {
    const account = await createAccount();
    const companyId = await seedCompany(
      account.organizationId,
      "Acme Corp",
      "acme.test"
    );
    const leadId = await seedLead(account.organizationId, { companyId });
    await seedDossierWithFact(
      account.organizationId,
      leadId,
      "https://acme.test/news"
    );

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}`,
      account.cookie
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Readonly<{
      id: string;
      company: Readonly<{ name: string }>;
      facts: ReadonlyArray<Readonly<{ text: string; sourceUrl: string }>>;
      sourcesCount: number;
      angles: ReadonlyArray<unknown>;
      timeline: ReadonlyArray<unknown>;
    }>;
    expect(body.id).toBe(leadId);
    expect(body.company.name).toBe("Acme Corp");
    expect(body.facts.length).toBe(1);
    expect(body.sourcesCount).toBe(1);
    expect(body.angles.length).toBe(1);
    expect(Array.isArray(body.timeline)).toBe(true);
  });

  it("every returned fact carries a non-empty source URL (no unsourced fact)", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    await seedDossierWithFact(
      account.organizationId,
      leadId,
      "https://acme.test/proof"
    );

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}`,
      account.cookie
    );
    const body = (await res.json()) as Readonly<{
      facts: ReadonlyArray<Readonly<{ text: string; sourceUrl: string }>>;
    }>;
    expect(body.facts.length).toBeGreaterThan(0);
    expect(
      body.facts.every(
        (fact) => typeof fact.sourceUrl === "string" && fact.sourceUrl !== ""
      )
    ).toBe(true);
  });

  it("returns 404 for an unknown prospect id in my org", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/prospects/${A_UUID}`,
      account.cookie
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingProspect");
  });
});

describe("prospects: input validation enforces the declared DTO bounds", () => {
  it("rejects a non-uuid prospect id on detail (400 invalidProspectId)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/prospects/not-a-uuid",
      account.cookie
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidProspectId");
  });

  it("rejects a non-uuid prospect id on stage update (400 invalidProspectId)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      "/api/v1/prospects/not-a-uuid/stage",
      account.cookie,
      "PATCH",
      { stage: "meeting", origin: "manual" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidProspectId");
  });

  it("rejects an out-of-enum stage (400 invalidStage)", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}/stage`,
      account.cookie,
      "PATCH",
      { stage: "archived", origin: "manual" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidStage");
  });

  it("rejects an out-of-enum origin (400 invalidOrigin)", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}/stage`,
      account.cookie,
      "PATCH",
      { stage: "meeting", origin: "robot" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidOrigin");
  });

  it("rejects an out-of-enum delete scope (400 invalidScope)", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}`,
      account.cookie,
      "DELETE",
      { scope: "planet" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidScope");
  });

  it("rejects a delete reason longer than MAX_EXCLUSION_REASON_LENGTH=500 (400 invalidReason)", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}`,
      account.cookie,
      "DELETE",
      { scope: "person", reason: "x".repeat(501) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidReason");
  });

  it("rejects a non-uuid senderId query on contact (400)", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/contact?senderId=not-a-uuid`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(400);
  });
});

describe("prospects: multi-tenant isolation (product invariant #1)", () => {
  it("lists only the prospects of the caller's active organization", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await seedLead(owner.organizationId, {
      firstName: "Secret",
      lastName: "Owner",
      email: "secret-owner@acme.test",
    });

    const ownerList = await authedRequest("/api/v1/prospects", owner.cookie);
    expect(((await ownerList.json()) as ReadonlyArray<unknown>).length).toBe(1);

    const otherList = await authedRequest("/api/v1/prospects", other.cookie);
    const otherBody = await otherList.json();
    expect((otherBody as ReadonlyArray<unknown>).length).toBe(0);
    expect(JSON.stringify(otherBody)).not.toContain("secret-owner@acme.test");
    expect(JSON.stringify(otherBody)).not.toContain("Secret");
  });

  it("refuses to read a prospect owned by another org (403 notInMyOrg, no data leak)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const leadId = await seedLead(owner.organizationId, {
      firstName: "Confidential",
      email: "confidential@acme.test",
    });

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}`,
      attacker.cookie
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("notInMyOrg");
    expect(JSON.stringify(body)).not.toContain("confidential@acme.test");
    expect(JSON.stringify(body)).not.toContain("Confidential");
  });

  it("refuses to update the stage of a prospect owned by another org (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const leadId = await seedLead(owner.organizationId);

    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}/stage`,
      attacker.cookie,
      "PATCH",
      { stage: "won", origin: "manual" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");

    const lead = await db<
      ReadonlyArray<Readonly<{ stage: string }>>
    >`SELECT stage FROM leads WHERE id = ${leadId}`;
    expect(lead[0]?.stage).toBe("identified");
  });

  it("refuses to delete a prospect owned by another org (403 notInMyOrg, no exclusion created)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const leadId = await seedLead(owner.organizationId, {
      email: "victim@acme.test",
    });

    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}`,
      attacker.cookie,
      "DELETE",
      { scope: "person" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");

    const lead = await db<
      ReadonlyArray<Readonly<{ excluded_at: Date | null }>>
    >`SELECT excluded_at FROM leads WHERE id = ${leadId}`;
    expect(lead[0]?.excluded_at).toBeNull();
  });

  it("refuses to contact a prospect owned by another org (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const leadId = await seedLead(owner.organizationId);

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/contact`,
      attacker.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");
  });

  it("refuses to validate a prospect owned by another org (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const leadId = await seedLead(owner.organizationId);

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/validate`,
      attacker.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");
  });
});

describe("prospects: stage lifecycle for the owning organization", () => {
  it("updates a prospect stage (200) and reflects the change", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);

    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}/stage`,
      account.cookie,
      "PATCH",
      { stage: "meeting", origin: "manual" }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(leadId);
    expect(body.stage).toBe("meeting");
    expect(body.origin).toBe("manual");
  });

  it("returns 404 updating the stage of an unknown prospect", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      `/api/v1/prospects/${A_UUID}/stage`,
      account.cookie,
      "PATCH",
      { stage: "meeting", origin: "manual" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingProspect");
  });
});

describe("prospects: delete (exclusion) lifecycle for the owning organization", () => {
  it("deletes a prospect person-scope (204), soft-deletes it and records an exclusion", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId, {
      email: "delete-me@acme.test",
    });

    const res = await jsonRequest(
      `/api/v1/prospects/${leadId}`,
      account.cookie,
      "DELETE",
      { scope: "person", reason: "not a fit" }
    );
    expect(res.status).toBe(204);

    const list = await authedRequest("/api/v1/prospects", account.cookie);
    expect(((await list.json()) as ReadonlyArray<unknown>).length).toBe(0);

    const exclusions = await db<
      ReadonlyArray<Readonly<{ email: string; reason: string | null }>>
    >`SELECT email, reason FROM exclusions WHERE organization_id = ${account.organizationId}`;
    expect(exclusions.length).toBe(1);
    expect(exclusions[0]?.email).toBe("delete-me@acme.test");
    expect(exclusions[0]?.reason).toBe("not a fit");
  });

  it("returns 404 deleting an unknown prospect", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      `/api/v1/prospects/${A_UUID}`,
      account.cookie,
      "DELETE",
      { scope: "person" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingProspect");
  });
});

describe("prospects: contact and validate send the latest draft", () => {
  it("contacts a prospect (200), moves it to stage 'contacted' and never leaks the sender secret", async () => {
    const account = await createAccount();
    await createActiveSender(account);
    const leadId = await seedLead(account.organizationId, {
      channel: "email",
      email: "target@acme.test",
    });
    await seedDraft(account.organizationId, leadId, "email");

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/contact`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(leadId);
    expect(body.stage).toBe("contacted");
    expect(JSON.stringify(body)).not.toContain(activeSenderSecret);
    expect(JSON.stringify(body)).not.toContain("secret_encrypted");
  });

  it("validates a first touch (200) and moves it to stage 'contacted'", async () => {
    const account = await createAccount();
    await createActiveSender(account);
    const leadId = await seedLead(account.organizationId, {
      channel: "email",
      email: "target2@acme.test",
    });
    await seedDraft(account.organizationId, leadId, "email");

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stage).toBe("contacted");
  });

  it("validates a follow-up (200) and moves it to stage 'following-up'", async () => {
    const account = await createAccount();
    await createActiveSender(account);
    const leadId = await seedLead(account.organizationId, {
      channel: "email",
      email: "target3@acme.test",
      stage: "contacted",
      sequenceStep: 1,
    });
    await seedDraft(account.organizationId, leadId, "email");

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stage).toBe("following-up");
  });

  it("validates a linkedin draft without any sender and marks the message sent", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId, {
      channel: "linkedin",
      email: null,
    });
    const messageId = await seedDraft(
      account.organizationId,
      leadId,
      "linkedin"
    );

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).stage).toBe("contacted");

    const [message] = await db`
      SELECT status, sent_at, sender_id FROM messages WHERE id = ${messageId}
    `;
    expect(message?.status).toBe("sent");
    expect(message?.sent_at).not.toBeNull();
    expect(message?.sender_id).toBeNull();

    const outcomes = await db`
      SELECT stage_signal FROM outcomes WHERE message_id = ${messageId}
    `;
    expect(outcomes.length).toBe(1);
    expect(outcomes[0]?.stage_signal).toBe("sent");

    const [lead] = await db`
      SELECT sequence_step, next_follow_up_at FROM leads WHERE id = ${leadId}
    `;
    expect(lead?.sequence_step).toBe(1);
    expect(lead?.next_follow_up_at).toBeNull();
  });

  it("moves a linkedin follow-up to stage 'following-up' on validation", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId, {
      channel: "linkedin",
      email: null,
      stage: "contacted",
      sequenceStep: 1,
    });
    await seedDraft(account.organizationId, leadId, "linkedin");

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).stage).toBe("following-up");

    const [lead] = await db`
      SELECT sequence_step FROM leads WHERE id = ${leadId}
    `;
    expect(lead?.sequence_step).toBe(2);
  });

  it("keeps recording the sender on an email send", async () => {
    const account = await createAccount();
    const senderId = await createActiveSender(account);
    const leadId = await seedLead(account.organizationId, {
      channel: "email",
      email: "sender-kept@acme.test",
    });
    const messageId = await seedDraft(
      account.organizationId,
      leadId,
      "email"
    );

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/validate`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);

    const [message] = await db`
      SELECT status, sender_id FROM messages WHERE id = ${messageId}
    `;
    expect(message?.status).toBe("sent");
    expect(message?.sender_id).toBe(senderId);
  });

  it("returns 422 noDraft when the prospect has no draft message", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId, {
      channel: "email",
      email: "no-draft@acme.test",
    });

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/contact`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("noDraft");
  });

  it("returns 422 noSender when an email prospect has a draft but no active sender", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId, {
      channel: "email",
      email: "no-sender@acme.test",
    });
    await seedDraft(account.organizationId, leadId, "email");

    const res = await authedRequest(
      `/api/v1/prospects/${leadId}/contact`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("noSender");
  });

  it("returns 404 contacting an unknown prospect", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/prospects/${A_UUID}/contact`,
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingProspect");
  });
});

describe("prospects: authentication is required on every route", () => {
  it("rejects unauthenticated list (401)", async () => {
    expect((await request("/api/v1/prospects")).status).toBe(401);
  });

  it("rejects unauthenticated detail (401)", async () => {
    expect(
      (await request(`/api/v1/prospects/${A_UUID}`)).status
    ).toBe(401);
  });

  it("rejects unauthenticated stage update (401)", async () => {
    const res = await jsonRequest(
      `/api/v1/prospects/${A_UUID}/stage`,
      null,
      "PATCH",
      { stage: "meeting", origin: "manual" }
    );
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated delete (401)", async () => {
    const res = await jsonRequest(
      `/api/v1/prospects/${A_UUID}`,
      null,
      "DELETE",
      { scope: "person" }
    );
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated contact (401)", async () => {
    const res = await request(`/api/v1/prospects/${A_UUID}/contact`, {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated validate (401)", async () => {
    const res = await request(`/api/v1/prospects/${A_UUID}/validate`, {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });
});
