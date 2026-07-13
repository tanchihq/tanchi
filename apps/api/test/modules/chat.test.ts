import { beforeEach, describe, expect, it } from "bun:test";
import {
  authedRequest,
  createAccount,
  jsonRequest,
  request,
} from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";

const UNKNOWN_UUID = "00000000-0000-7000-8000-000000000000";

type ConversationSummary = Readonly<{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}>;

type AttachedLead = Readonly<{
  leadId: string;
  name: string;
  company: string;
  stage: string;
}>;

type ConversationDetail = ConversationSummary &
  Readonly<{
    messages: ReadonlyArray<
      Readonly<{
        id: string;
        role: "user" | "assistant";
        content: string;
        createdAt: string;
      }>
    >;
    leads: ReadonlyArray<AttachedLead>;
  }>;

type SeededLead = Readonly<{
  leadId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  fullName: string;
}>;

const createConversation = async (
  cookie: string,
  title?: string
): Promise<ConversationSummary> => {
  const res = await jsonRequest(
    "/api/v1/chat",
    cookie,
    "POST",
    title === undefined ? {} : { title }
  );
  expect(res.status).toBe(201);
  return (await res.json()) as ConversationSummary;
};

const seedLead = async (
  organizationId: string,
  marker: string
): Promise<SeededLead> => {
  const companyId = Bun.randomUUIDv7();
  const leadId = Bun.randomUUIDv7();
  const companyName = `Company-${marker}`;
  const firstName = `First-${marker}`;
  const lastName = `Last-${marker}`;
  await db`
    INSERT INTO companies (id, organization_id, name)
    VALUES (${companyId}, ${organizationId}, ${companyName})
  `;
  await db`
    INSERT INTO leads (id, organization_id, company_id, first_name, last_name, stage)
    VALUES (${leadId}, ${organizationId}, ${companyId}, ${firstName}, ${lastName}, 'identified')
  `;
  return {
    leadId,
    companyName,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
  };
};

beforeEach(truncateAll);

describe("chat: create conversation contract (POST /)", () => {
  it("creates a conversation (201) with the ConversationSummary shape", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/chat", account.cookie, "POST", {
      title: "Prospection Q3",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as ConversationSummary;
    expect(body.id).toBeString();
    expect(body.title).toBe("Prospection Q3");
    expect(body.createdAt).toBeString();
    expect(body.updatedAt).toBeString();
    expect(new Date(body.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("accepts an omitted title and stores the empty default", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/chat", account.cookie, "POST", {});
    expect(res.status).toBe(201);
    expect((await res.json() as ConversationSummary).title).toBe("");
  });

  it("rejects a title longer than MAX_TITLE_LENGTH=200 (400 invalidTitle)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/chat", account.cookie, "POST", {
      title: "x".repeat(201),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidTitle");
  });

  it("rejects a non-string title (400 invalidTitle)", async () => {
    const account = await createAccount();
    const res = await jsonRequest("/api/v1/chat", account.cookie, "POST", {
      title: 42,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidTitle");
  });
});

describe("chat: list conversations (GET /)", () => {
  it("returns the conversations of the caller's organization", async () => {
    const account = await createAccount();
    await createConversation(account.cookie, "First");
    await createConversation(account.cookie, "Second");
    const res = await authedRequest("/api/v1/chat", account.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ReadonlyArray<ConversationSummary>;
    expect(body.length).toBe(2);
  });

  it("isolates the list per organization (product invariant #1)", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await createConversation(owner.cookie, "Owner only");

    const ownerList = (await (
      await authedRequest("/api/v1/chat", owner.cookie)
    ).json()) as ReadonlyArray<ConversationSummary>;
    expect(ownerList.length).toBe(1);

    const otherRes = await authedRequest("/api/v1/chat", other.cookie);
    const otherList = (await otherRes.json()) as ReadonlyArray<ConversationSummary>;
    expect(otherList.length).toBe(0);
    expect(JSON.stringify(otherList)).not.toContain("Owner only");
  });
});

describe("chat: get one conversation (GET /:id)", () => {
  it("returns the detail with messages and leads arrays", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "Detail");
    const res = await authedRequest(
      `/api/v1/chat/${conversation.id}`,
      account.cookie
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as ConversationDetail;
    expect(body.id).toBe(conversation.id);
    expect(body.messages).toBeArray();
    expect(body.leads).toBeArray();
    expect(body.messages.length).toBe(0);
    expect(body.leads.length).toBe(0);
  });

  it("rejects a malformed conversation id (400 invalidConversationId)", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/chat/not-a-uuid", account.cookie);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidConversationId");
  });

  it("returns 404 inexistingConversation for an unknown id", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/chat/${UNKNOWN_UUID}`,
      account.cookie
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingConversation");
  });

  it("refuses to read another organization's conversation (403 notInMyOrg, no leak)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const conversation = await createConversation(
      owner.cookie,
      "SECRET-OWNER-TITLE"
    );
    const res = await authedRequest(
      `/api/v1/chat/${conversation.id}`,
      attacker.cookie
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("notInMyOrg");
    expect(JSON.stringify(body)).not.toContain("SECRET-OWNER-TITLE");
  });
});

describe("chat: attach a lead (POST /:id/leads)", () => {
  it("attaches a lead of the same organization (201 AttachedLead)", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "Attach");
    const lead = await seedLead(account.organizationId, "own");
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      account.cookie,
      "POST",
      { leadId: lead.leadId }
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as AttachedLead;
    expect(body.leadId).toBe(lead.leadId);
    expect(body.name).toBe(lead.fullName);
    expect(body.company).toBe(lead.companyName);
    expect(body.stage).toBe("identified");
  });

  it("makes the attached lead visible in the conversation detail", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "Attach2");
    const lead = await seedLead(account.organizationId, "visible");
    await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      account.cookie,
      "POST",
      { leadId: lead.leadId }
    );
    const detail = (await (
      await authedRequest(`/api/v1/chat/${conversation.id}`, account.cookie)
    ).json()) as ConversationDetail;
    expect(detail.leads.length).toBe(1);
    expect(detail.leads[0]?.leadId).toBe(lead.leadId);
  });

  it("refuses to attach a lead owned by another organization (404 inexistingLead, security-critical)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const conversation = await createConversation(owner.cookie, "CrossOrgLead");
    const foreignLead = await seedLead(attacker.organizationId, "foreign");
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      owner.cookie,
      "POST",
      { leadId: foreignLead.leadId }
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("inexistingLead");
    expect(JSON.stringify(body)).not.toContain(foreignLead.companyName);
    expect(JSON.stringify(body)).not.toContain(foreignLead.firstName);

    const detail = (await (
      await authedRequest(`/api/v1/chat/${conversation.id}`, owner.cookie)
    ).json()) as ConversationDetail;
    expect(detail.leads.length).toBe(0);
  });

  it("refuses to attach a lead onto another organization's conversation (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const conversation = await createConversation(owner.cookie, "OwnerConv");
    const attackerLead = await seedLead(attacker.organizationId, "atk");
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      attacker.cookie,
      "POST",
      { leadId: attackerLead.leadId }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");
  });

  it("returns 404 inexistingLead for an unknown lead id in my org", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "GhostLead");
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      account.cookie,
      "POST",
      { leadId: UNKNOWN_UUID }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingLead");
  });

  it("rejects a malformed leadId (400 invalidLeadId)", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "BadLead");
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      account.cookie,
      "POST",
      { leadId: "not-a-uuid" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidLeadId");
  });
});

describe("chat: detach a lead (DELETE /:id/leads/:leadId)", () => {
  it("detaches an attached lead (204) and it disappears from the detail", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "Detach");
    const lead = await seedLead(account.organizationId, "detach");
    await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      account.cookie,
      "POST",
      { leadId: lead.leadId }
    );
    const res = await authedRequest(
      `/api/v1/chat/${conversation.id}/leads/${lead.leadId}`,
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(204);
    const detail = (await (
      await authedRequest(`/api/v1/chat/${conversation.id}`, account.cookie)
    ).json()) as ConversationDetail;
    expect(detail.leads.length).toBe(0);
  });

  it("rejects a malformed leadId on detach (400 invalidLeadId)", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "DetachBad");
    const res = await authedRequest(
      `/api/v1/chat/${conversation.id}/leads/not-a-uuid`,
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidLeadId");
  });

  it("rejects a malformed conversation id on detach (400 invalidConversationId)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/chat/not-a-uuid/leads/${UNKNOWN_UUID}`,
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidConversationId");
  });

  it("refuses to detach from another organization's conversation (403 notInMyOrg)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const conversation = await createConversation(owner.cookie, "OwnerDetach");
    const lead = await seedLead(owner.organizationId, "ownerdetach");
    await jsonRequest(
      `/api/v1/chat/${conversation.id}/leads`,
      owner.cookie,
      "POST",
      { leadId: lead.leadId }
    );
    const res = await authedRequest(
      `/api/v1/chat/${conversation.id}/leads/${lead.leadId}`,
      attacker.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");

    const detail = (await (
      await authedRequest(`/api/v1/chat/${conversation.id}`, owner.cookie)
    ).json()) as ConversationDetail;
    expect(detail.leads.length).toBe(1);
  });
});

describe("chat: delete a conversation (DELETE /:id)", () => {
  it("deletes a conversation (204) after which it is gone", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie, "ToDelete");
    const res = await authedRequest(
      `/api/v1/chat/${conversation.id}`,
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(204);
    const after = await authedRequest(
      `/api/v1/chat/${conversation.id}`,
      account.cookie
    );
    expect(after.status).toBe(404);
    expect((await after.json()).message).toBe("inexistingConversation");
  });

  it("rejects a malformed conversation id on delete (400 invalidConversationId)", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/chat/not-a-uuid", account.cookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidConversationId");
  });

  it("returns 404 inexistingConversation when deleting an unknown id", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/chat/${UNKNOWN_UUID}`,
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingConversation");
  });

  it("refuses to delete another organization's conversation (403 notInMyOrg, no mutation)", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const conversation = await createConversation(owner.cookie, "Protected");
    const res = await authedRequest(
      `/api/v1/chat/${conversation.id}`,
      attacker.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe("notInMyOrg");

    const stillThere = await authedRequest(
      `/api/v1/chat/${conversation.id}`,
      owner.cookie
    );
    expect(stillThere.status).toBe(200);
  });
});

describe("chat: SSE message stream (POST /:id/messages)", () => {
  it("streams through the mocked llm and completes (200 text/event-stream)", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie);
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/messages`,
      account.cookie,
      "POST",
      { content: "Hello agent" }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const body = await res.text();
    expect(body).toContain("event: user");
    expect(body).toContain("event: delta");
    expect(body).toContain("event: done");
    expect(body).toContain("mock-agent-text");
    expect(body).not.toContain("event: error");
  });

  it("persists the user turn and the assistant reply and auto-titles from content", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie);
    const stream = await jsonRequest(
      `/api/v1/chat/${conversation.id}/messages`,
      account.cookie,
      "POST",
      { content: "Draft an intro email" }
    );
    await stream.text();
    const detail = (await (
      await authedRequest(`/api/v1/chat/${conversation.id}`, account.cookie)
    ).json()) as ConversationDetail;
    expect(detail.title).toBe("Draft an intro email");
    expect(detail.messages.length).toBe(2);
    expect(detail.messages[0]?.role).toBe("user");
    expect(detail.messages[0]?.content).toBe("Draft an intro email");
    expect(detail.messages[1]?.role).toBe("assistant");
    expect(detail.messages[1]?.content).toBe("mock-agent-text");
  });

  it("rejects empty content (400 invalidContent)", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie);
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/messages`,
      account.cookie,
      "POST",
      { content: "   " }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidContent");
  });

  it("rejects content longer than MAX_CONTENT_LENGTH=8000 (400 invalidContent)", async () => {
    const account = await createAccount();
    const conversation = await createConversation(account.cookie);
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/messages`,
      account.cookie,
      "POST",
      { content: "x".repeat(8001) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidContent");
  });

  it("rejects a malformed conversation id (400 invalidConversationId)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      "/api/v1/chat/not-a-uuid/messages",
      account.cookie,
      "POST",
      { content: "Hi" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidConversationId");
  });

  it("refuses another organization's conversation via an in-band error event without leaking or mutating", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    const conversation = await createConversation(
      owner.cookie,
      "SECRET-OWNER-TITLE"
    );
    const res = await jsonRequest(
      `/api/v1/chat/${conversation.id}/messages`,
      attacker.cookie,
      "POST",
      { content: "let me in" }
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("event: error");
    expect(body).toContain("notInMyOrg");
    expect(body).not.toContain("SECRET-OWNER-TITLE");
    expect(body).not.toContain("mock-agent-text");

    const detail = (await (
      await authedRequest(`/api/v1/chat/${conversation.id}`, owner.cookie)
    ).json()) as ConversationDetail;
    expect(detail.messages.length).toBe(0);
  });
});

describe("chat: authentication is required on every route (401)", () => {
  it("rejects unauthenticated access on all chat routes", async () => {
    expect((await request("/api/v1/chat")).status).toBe(401);
    expect(
      (await jsonRequest("/api/v1/chat", null, "POST", { title: "x" })).status
    ).toBe(401);
    expect(
      (await request(`/api/v1/chat/${UNKNOWN_UUID}`)).status
    ).toBe(401);
    expect(
      (
        await jsonRequest(
          `/api/v1/chat/${UNKNOWN_UUID}/messages`,
          null,
          "POST",
          { content: "hi" }
        )
      ).status
    ).toBe(401);
    expect(
      (
        await jsonRequest(`/api/v1/chat/${UNKNOWN_UUID}/leads`, null, "POST", {
          leadId: UNKNOWN_UUID,
        })
      ).status
    ).toBe(401);
    expect(
      (
        await request(
          `/api/v1/chat/${UNKNOWN_UUID}/leads/${UNKNOWN_UUID}`,
          { method: "DELETE" }
        )
      ).status
    ).toBe(401);
    expect(
      (
        await request(`/api/v1/chat/${UNKNOWN_UUID}`, { method: "DELETE" })
      ).status
    ).toBe(401);
  });
});
