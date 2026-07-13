import { beforeEach, describe, expect, it } from "bun:test";
import { authedRequest, createAccount, request } from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";

type ExclusionEntry = Readonly<{
  id: string;
  scope: "person" | "company";
  email: string | null;
  companyDomain: string | null;
  reason: string | null;
  createdAt: string;
}>;

const csvFile = (text: string, name = "list.csv") =>
  new File([text], name, { type: "text/csv" });

const importForm = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return form;
};

const importCsv = (cookie: string, text: string) =>
  authedRequest("/api/v1/suppression/import", cookie, {
    method: "POST",
    body: importForm(csvFile(text)),
  });

const listExclusions = async (cookie: string): Promise<ReadonlyArray<ExclusionEntry>> => {
  const res = await authedRequest("/api/v1/suppression", cookie);
  expect(res.status).toBe(200);
  return (await res.json()) as ReadonlyArray<ExclusionEntry>;
};

const seedCompanyExclusion = async (
  organizationId: string,
  companyDomain: string
): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO exclusions (id, organization_id, scope, company_domain)
    VALUES (${id}, ${organizationId}, 'company', ${companyDomain})
  `;
  return id;
};

beforeEach(truncateAll);

describe("suppression: import happy path and response contract", () => {
  it("imports emails from a CSV (201) and reports imported/totalFound", async () => {
    const account = await createAccount();
    const res = await importCsv(account.cookie, "alice@acme.test\nbob@acme.test\n");
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.imported).toBe(2);
    expect(body.totalFound).toBe(2);
  });

  it("deduplicates and lowercases addresses before counting (extractEmails contract)", async () => {
    const account = await createAccount();
    const res = await importCsv(
      account.cookie,
      "Alice@Acme.Test\nALICE@acme.test\nbob@acme.test\n"
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalFound).toBe(2);
    expect(body.imported).toBe(2);
  });

  it("does not re-insert an already-excluded address (ON CONFLICT DO NOTHING)", async () => {
    const account = await createAccount();
    const first = await importCsv(account.cookie, "carol@acme.test\n");
    expect((await first.json()).imported).toBe(1);
    const second = await importCsv(account.cookie, "carol@acme.test\n");
    const secondBody = await second.json();
    expect(secondBody.totalFound).toBe(1);
    expect(secondBody.imported).toBe(0);
  });

  it("returns imported person entries in the declared DTO shape", async () => {
    const account = await createAccount();
    await importCsv(account.cookie, "dave@acme.test\n");
    const entries = await listExclusions(account.cookie);
    expect(entries.length).toBe(1);
    const entry = entries[0]!;
    expect(entry.id).toBeString();
    expect(entry.scope).toBe("person");
    expect(entry.email).toBe("dave@acme.test");
    expect(entry.companyDomain).toBeNull();
    expect(entry.reason).toBeNull();
    expect(entry.createdAt).toBeString();
    expect(new Date(entry.createdAt).toISOString()).toBe(entry.createdAt);
  });
});

describe("suppression: input validation enforces the declared DTO bounds", () => {
  it("rejects an empty file (400 invalidFile)", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/suppression/import", account.cookie, {
      method: "POST",
      body: importForm(csvFile("")),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidFile");
  });

  it("rejects a request with no file field (400 invalidFile)", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/suppression/import", account.cookie, {
      method: "POST",
      body: new FormData(),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidFile");
  });

  it("rejects a malformed exclusion id on delete (400 invalidExclusionId)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/suppression/not-a-uuid",
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidExclusionId");
  });

  it("returns 422 noEmailsFound for a non-empty file without any address", async () => {
    const account = await createAccount();
    const res = await importCsv(account.cookie, "just some text, no addresses here\n");
    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("noEmailsFound");
  });
});

describe("suppression: multi-tenant isolation (product invariant #1)", () => {
  it("lists only the exclusions of the caller's active organization", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await importCsv(owner.cookie, "owner@acme.test\n");

    const ownerList = await listExclusions(owner.cookie);
    expect(ownerList.length).toBe(1);

    const otherList = await listExclusions(other.cookie);
    expect(otherList.length).toBe(0);
    expect(JSON.stringify(otherList)).not.toContain("owner@acme.test");
  });

  it("refuses to delete an exclusion owned by another organization (404) and preserves it", async () => {
    const owner = await createAccount();
    const attacker = await createAccount();
    await importCsv(owner.cookie, "victim@acme.test\n");
    const ownerEntries = await listExclusions(owner.cookie);
    const targetId = ownerEntries[0]!.id;

    const res = await authedRequest(
      `/api/v1/suppression/${targetId}`,
      attacker.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingExclusion");

    const stillThere = await listExclusions(owner.cookie);
    expect(stillThere.length).toBe(1);
    expect(stillThere[0]!.email).toBe("victim@acme.test");
  });
});

describe("suppression: delete lifecycle for the owning organization", () => {
  it("deletes a person exclusion (204) and it disappears from the list", async () => {
    const account = await createAccount();
    await importCsv(account.cookie, "erin@acme.test\n");
    const entries = await listExclusions(account.cookie);
    const res = await authedRequest(
      `/api/v1/suppression/${entries[0]!.id}`,
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(204);
    expect((await listExclusions(account.cookie)).length).toBe(0);
  });

  it("deletes a company-scope exclusion (204) and it disappears from the list", async () => {
    const account = await createAccount();
    const id = await seedCompanyExclusion(account.organizationId, "acme.test");
    const before = await listExclusions(account.cookie);
    expect(before.length).toBe(1);
    expect(before[0]!.scope).toBe("company");
    expect(before[0]!.companyDomain).toBe("acme.test");

    const res = await authedRequest(`/api/v1/suppression/${id}`, account.cookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);
    expect((await listExclusions(account.cookie)).length).toBe(0);
  });

  it("returns 404 inexistingExclusion for an unknown exclusion id", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/suppression/00000000-0000-7000-8000-000000000000",
      account.cookie,
      { method: "DELETE" }
    );
    expect(res.status).toBe(404);
    expect((await res.json()).message).toBe("inexistingExclusion");
  });
});

describe("suppression: authentication is required on every route", () => {
  it("rejects unauthenticated list (401)", async () => {
    expect((await request("/api/v1/suppression")).status).toBe(401);
  });

  it("rejects unauthenticated import (401)", async () => {
    const res = await request("/api/v1/suppression/import", {
      method: "POST",
      body: importForm(csvFile("alice@acme.test\n")),
    });
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated delete (401)", async () => {
    const res = await request(
      "/api/v1/suppression/00000000-0000-7000-8000-000000000000",
      { method: "DELETE" }
    );
    expect(res.status).toBe(401);
  });
});
