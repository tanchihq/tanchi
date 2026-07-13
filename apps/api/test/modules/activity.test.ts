import { beforeEach, describe, expect, it } from "bun:test";
import { authedRequest, createAccount, request } from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";
import {
  ACTIVITY_DEFAULT_LIMIT,
  ACTIVITY_MAX_LIMIT,
} from "../../src/modules/activity/activity.constants.ts";

type SeedActivity = Readonly<{
  type: string;
  title: string;
  createdAt?: Date;
  leadId?: string | null;
}>;

const seedLead = async (organizationId: string): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO leads ${db({
      id,
      organization_id: organizationId,
      first_name: "Jane",
      last_name: "Doe",
    })}
  `;
  return id;
};

const seedActivity = async (
  organizationId: string,
  activity: SeedActivity
): Promise<string> => {
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO activity ${db({
      id,
      organization_id: organizationId,
      type: activity.type,
      title: activity.title,
      lead_id: activity.leadId ?? null,
      created_at: activity.createdAt ?? new Date(),
    })}
  `;
  return id;
};

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

beforeEach(truncateAll);

describe("activity feed: happy path and response contract", () => {
  it("returns the org's seeded rows with the ActivityItemDto shape", async () => {
    const account = await createAccount();
    const leadId = await seedLead(account.organizationId);
    await seedActivity(account.organizationId, {
      type: "profiled",
      title: "Profiled Acme Corp",
      leadId,
    });

    const res = await authedRequest("/api/v1/activity", account.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ReadonlyArray<
      Readonly<{
        id: string;
        type: string;
        title: string;
        leadId: string | null;
        createdAt: string;
      }>
    >;
    expect(body.length).toBe(1);
    const item = body[0];
    if (item === undefined) throw new Error("expected one activity item");
    expect(item.id).toBeString();
    expect(item.type).toBe("profiled");
    expect(item.title).toBe("Profiled Acme Corp");
    expect(item.leadId).toBe(leadId);
    expect(item.createdAt).toBeString();
    expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
  });

  it("exposes leadId as null when the activity row has no lead", async () => {
    const account = await createAccount();
    await seedActivity(account.organizationId, {
      type: "run_started",
      title: "Nightly run started",
    });

    const res = await authedRequest("/api/v1/activity", account.cookie);
    const body = (await res.json()) as ReadonlyArray<
      Readonly<{ leadId: string | null }>
    >;
    expect(body[0]?.leadId).toBeNull();
  });

  it("returns an empty array when the org has no activity", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/activity", account.cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("orders rows by created_at DESC (most recent first)", async () => {
    const account = await createAccount();
    await seedActivity(account.organizationId, {
      type: "sent",
      title: "oldest",
      createdAt: daysAgo(3),
    });
    await seedActivity(account.organizationId, {
      type: "sent",
      title: "newest",
      createdAt: daysAgo(1),
    });
    await seedActivity(account.organizationId, {
      type: "sent",
      title: "middle",
      createdAt: daysAgo(2),
    });

    const res = await authedRequest("/api/v1/activity", account.cookie);
    const body = (await res.json()) as ReadonlyArray<
      Readonly<{ title: string }>
    >;
    expect(body.map((row) => row.title)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("caps the returned rows at the requested limit", async () => {
    const account = await createAccount();
    await Promise.all(
      Array.from({ length: 5 }, (_unused, index) =>
        seedActivity(account.organizationId, {
          type: "drafted",
          title: `row-${index}`,
          createdAt: daysAgo(index),
        })
      )
    );

    const res = await authedRequest(
      "/api/v1/activity?limit=2",
      account.cookie
    );
    const body = (await res.json()) as ReadonlyArray<unknown>;
    expect(body.length).toBe(2);
  });
});

describe("activity feed: query-param validation enforces declared bounds", () => {
  it(`rejects a limit above ACTIVITY_MAX_LIMIT=${ACTIVITY_MAX_LIMIT} (400, not 422)`, async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/activity?limit=${ACTIVITY_MAX_LIMIT + 1}`,
      account.cookie
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBeString();
  });

  it("rejects a limit below the declared minimum of 1 (400, not 422)", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/activity?limit=0", account.cookie);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBeString();
  });

  it("rejects a non-numeric limit (400, not 422)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/activity?limit=abc",
      account.cookie
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBeString();
  });

  it(`accepts an omitted limit and defaults to ACTIVITY_DEFAULT_LIMIT=${ACTIVITY_DEFAULT_LIMIT}`, async () => {
    const account = await createAccount();
    await Promise.all(
      Array.from({ length: 3 }, (_unused, index) =>
        seedActivity(account.organizationId, {
          type: "sent",
          title: `row-${index}`,
          createdAt: daysAgo(index),
        })
      )
    );
    const res = await authedRequest("/api/v1/activity", account.cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).length).toBe(3);
  });

  it("accepts the maximum declared limit boundary (200)", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      `/api/v1/activity?limit=${ACTIVITY_MAX_LIMIT}`,
      account.cookie
    );
    expect(res.status).toBe(200);
  });
});

describe("activity feed: multi-tenant isolation (product invariant #1)", () => {
  it("returns only the caller's organization rows, never another org's", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await seedActivity(owner.organizationId, {
      type: "profiled",
      title: "owner-row",
    });
    await seedActivity(other.organizationId, {
      type: "profiled",
      title: "other-row",
    });

    const ownerFeed = await authedRequest("/api/v1/activity", owner.cookie);
    const ownerBody = (await ownerFeed.json()) as ReadonlyArray<
      Readonly<{ title: string }>
    >;
    expect(ownerBody.length).toBe(1);
    expect(ownerBody[0]?.title).toBe("owner-row");
    expect(ownerBody.some((row) => row.title === "other-row")).toBe(false);

    const otherFeed = await authedRequest("/api/v1/activity", other.cookie);
    const otherBody = (await otherFeed.json()) as ReadonlyArray<
      Readonly<{ title: string }>
    >;
    expect(otherBody.length).toBe(1);
    expect(otherBody[0]?.title).toBe("other-row");
  });
});

describe("activity status: happy path and response contract", () => {
  it("returns the ActivityStatusDto shape with zeroed counts for a fresh org", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/activity/status", account.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Readonly<{
      isRunning: boolean;
      lastRunAt: string | null;
      nextRunAt: string;
      today: Readonly<{
        researched: number;
        drafted: number;
        sent: number;
        replies: number;
      }>;
    }>;
    expect(body.isRunning).toBe(false);
    expect(body.lastRunAt).toBeNull();
    expect(body.nextRunAt).toBeString();
    expect(new Date(body.nextRunAt).toISOString()).toBe(body.nextRunAt);
    expect(body.today).toEqual({
      researched: 0,
      drafted: 0,
      sent: 0,
      replies: 0,
    });
  });

  it("counts today's activity per type", async () => {
    const account = await createAccount();
    await Promise.all([
      seedActivity(account.organizationId, {
        type: "profiled",
        title: "p1",
      }),
      seedActivity(account.organizationId, {
        type: "profiled",
        title: "p2",
      }),
      seedActivity(account.organizationId, { type: "drafted", title: "d1" }),
      seedActivity(account.organizationId, { type: "sent", title: "s1" }),
      seedActivity(account.organizationId, { type: "sent", title: "s2" }),
      seedActivity(account.organizationId, { type: "sent", title: "s3" }),
      seedActivity(account.organizationId, { type: "reply", title: "r1" }),
    ]);

    const res = await authedRequest("/api/v1/activity/status", account.cookie);
    const body = (await res.json()) as Readonly<{
      today: Readonly<{
        researched: number;
        drafted: number;
        sent: number;
        replies: number;
      }>;
    }>;
    expect(body.today).toEqual({
      researched: 2,
      drafted: 1,
      sent: 3,
      replies: 1,
    });
  });

  it("excludes rows from previous days from today's counts", async () => {
    const account = await createAccount();
    await seedActivity(account.organizationId, {
      type: "sent",
      title: "yesterday",
      createdAt: daysAgo(1),
    });
    await seedActivity(account.organizationId, {
      type: "sent",
      title: "today",
    });

    const res = await authedRequest("/api/v1/activity/status", account.cookie);
    const body = (await res.json()) as Readonly<{
      today: Readonly<{ sent: number }>;
    }>;
    expect(body.today.sent).toBe(1);
  });

  it("reports isRunning=true when a run has started but not finished", async () => {
    const account = await createAccount();
    await seedActivity(account.organizationId, {
      type: "run_started",
      title: "started",
      createdAt: daysAgo(0),
    });

    const res = await authedRequest("/api/v1/activity/status", account.cookie);
    const body = (await res.json()) as Readonly<{
      isRunning: boolean;
      lastRunAt: string | null;
    }>;
    expect(body.isRunning).toBe(true);
    expect(body.lastRunAt).toBeString();
  });

  it("reports isRunning=false once the run is done after it started", async () => {
    const account = await createAccount();
    await seedActivity(account.organizationId, {
      type: "run_started",
      title: "started",
      createdAt: daysAgo(2),
    });
    await seedActivity(account.organizationId, {
      type: "run_done",
      title: "done",
      createdAt: daysAgo(1),
    });

    const res = await authedRequest("/api/v1/activity/status", account.cookie);
    const body = (await res.json()) as Readonly<{
      isRunning: boolean;
      lastRunAt: string | null;
    }>;
    expect(body.isRunning).toBe(false);
    expect(body.lastRunAt).toBeString();
  });
});

describe("activity status: multi-tenant isolation (product invariant #1)", () => {
  it("never counts another organization's activity", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    await seedActivity(other.organizationId, { type: "sent", title: "leak" });
    await seedActivity(other.organizationId, {
      type: "profiled",
      title: "leak2",
    });

    const res = await authedRequest("/api/v1/activity/status", owner.cookie);
    const body = (await res.json()) as Readonly<{
      today: Readonly<{
        researched: number;
        drafted: number;
        sent: number;
        replies: number;
      }>;
    }>;
    expect(body.today).toEqual({
      researched: 0,
      drafted: 0,
      sent: 0,
      replies: 0,
    });
  });
});

describe("activity: authentication is required on every route", () => {
  it("rejects the unauthenticated feed (401)", async () => {
    expect((await request("/api/v1/activity")).status).toBe(401);
  });

  it("rejects the unauthenticated status endpoint (401)", async () => {
    expect((await request("/api/v1/activity/status")).status).toBe(401);
  });
});
