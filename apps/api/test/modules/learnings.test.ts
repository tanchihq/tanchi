import { beforeEach, describe, expect, it } from "bun:test";
import { authedRequest, createAccount, request } from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";

type LearningDto = Readonly<{
  icp: string;
  points: ReadonlyArray<string>;
  stat: string;
}>;

type LearningsDto = ReadonlyArray<LearningDto>;

const seedIcp = async (
  organizationId: string,
  name: string,
  position: number
): Promise<string> => {
  const marketId = Bun.randomUUIDv7();
  await db`
    INSERT INTO market (id, organization_id, name, position)
    VALUES (${marketId}, ${organizationId}, ${`${name} market`}, ${position})
  `;
  const id = Bun.randomUUIDv7();
  await db`
    INSERT INTO icp (id, organization_id, market_id, name, description, position)
    VALUES (${id}, ${organizationId}, ${marketId}, ${name}, ${"seeded description"}, ${position})
  `;
  return id;
};

const seedPlaybook = async (
  organizationId: string,
  icpId: string,
  content: string,
  version: number
): Promise<void> => {
  await db`
    INSERT INTO playbook (id, organization_id, icp_id, content, version, generated_at)
    VALUES (
      ${Bun.randomUUIDv7()},
      ${organizationId},
      ${icpId},
      ${content},
      ${version},
      ${new Date().toISOString()}
    )
  `;
};

const getLearnings = async (cookie: string): Promise<LearningsDto> => {
  const res = await authedRequest("/api/v1/learnings", cookie);
  expect(res.status).toBe(200);
  return (await res.json()) as LearningsDto;
};

beforeEach(truncateAll);

describe("learnings: response contract (per-ICP playbook DTO)", () => {
  it("returns one entry per ICP with the declared { icp, points, stat } shape", async () => {
    const account = await createAccount();
    const icpId = await seedIcp(account.organizationId, "Growth CTOs", 0);
    await seedPlaybook(
      account.organizationId,
      icpId,
      "- Lead with the migration pain\n- Reference a peer in the same stack",
      1
    );

    const body = await getLearnings(account.cookie);

    expect(body.length).toBe(1);
    const entry = body[0] as LearningDto;
    expect(entry.icp).toBe("Growth CTOs");
    expect(entry.points).toEqual([
      "Lead with the migration pain",
      "Reference a peer in the same stack",
    ]);
    expect(typeof entry.stat).toBe("string");
  });

  it("splits playbook content into plain-language points, stripping bullet markers and blanks", async () => {
    const account = await createAccount();
    const icpId = await seedIcp(account.organizationId, "RevOps leads", 0);
    await seedPlaybook(
      account.organizationId,
      icpId,
      "* First point\n\n• Second point\n   \n- Third point",
      1
    );

    const body = await getLearnings(account.cookie);

    expect((body[0] as LearningDto).points).toEqual([
      "First point",
      "Second point",
      "Third point",
    ]);
  });

  it("exposes no internal engine jargon columns in the DTO (plain-language product invariant)", async () => {
    const account = await createAccount();
    const icpId = await seedIcp(account.organizationId, "Founders", 0);
    await seedPlaybook(account.organizationId, icpId, "- Be concise", 1);

    const res = await authedRequest("/api/v1/learnings", account.cookie);
    const body = (await res.json()) as LearningsDto;
    const entry = body[0] as LearningDto;

    expect(Object.keys(entry).sort()).toEqual(["icp", "points", "stat"]);
    expect(entry).not.toHaveProperty("reward");
    expect(entry).not.toHaveProperty("bandit");
    expect(entry).not.toHaveProperty("version");
    expect(entry).not.toHaveProperty("organization_id");
  });
});

describe("learnings: latest playbook version wins", () => {
  it("returns the content of the highest playbook version for an ICP", async () => {
    const account = await createAccount();
    const icpId = await seedIcp(account.organizationId, "Ops managers", 0);
    await seedPlaybook(account.organizationId, icpId, "- Outdated angle", 1);
    await seedPlaybook(account.organizationId, icpId, "- Fresh angle", 2);

    const body = await getLearnings(account.cookie);

    expect(body.length).toBe(1);
    expect((body[0] as LearningDto).points).toEqual(["Fresh angle"]);
  });
});

describe("learnings: ordering and empty contracts", () => {
  it("orders entries by ICP position ascending", async () => {
    const account = await createAccount();
    const second = await seedIcp(account.organizationId, "Second ICP", 1);
    const first = await seedIcp(account.organizationId, "First ICP", 0);
    await seedPlaybook(account.organizationId, first, "- one", 1);
    await seedPlaybook(account.organizationId, second, "- two", 1);

    const body = await getLearnings(account.cookie);

    expect(body.map((entry) => entry.icp)).toEqual(["First ICP", "Second ICP"]);
  });

  it("returns an ICP with empty points when it has no playbook yet", async () => {
    const account = await createAccount();
    await seedIcp(account.organizationId, "Unwritten ICP", 0);

    const body = await getLearnings(account.cookie);

    expect(body.length).toBe(1);
    expect((body[0] as LearningDto).icp).toBe("Unwritten ICP");
    expect((body[0] as LearningDto).points).toEqual([]);
  });

  it("returns an empty list when the organization has no ICPs", async () => {
    const account = await createAccount();

    const body = await getLearnings(account.cookie);

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });
});

describe("learnings: multi-tenant isolation (product invariant #1)", () => {
  it("returns only the caller's learnings, never another organization's", async () => {
    const owner = await createAccount();
    const other = await createAccount();

    const ownerIcp = await seedIcp(owner.organizationId, "Owner ICP", 0);
    await seedPlaybook(owner.organizationId, ownerIcp, "- owner secret", 1);

    const otherIcp = await seedIcp(other.organizationId, "Other ICP", 0);
    await seedPlaybook(other.organizationId, otherIcp, "- other secret", 1);

    const ownerBody = await getLearnings(owner.cookie);
    expect(ownerBody.map((entry) => entry.icp)).toEqual(["Owner ICP"]);
    expect(JSON.stringify(ownerBody)).not.toContain("Other ICP");
    expect(JSON.stringify(ownerBody)).not.toContain("other secret");

    const otherBody = await getLearnings(other.cookie);
    expect(otherBody.map((entry) => entry.icp)).toEqual(["Other ICP"]);
    expect(JSON.stringify(otherBody)).not.toContain("Owner ICP");
    expect(JSON.stringify(otherBody)).not.toContain("owner secret");
  });
});

describe("learnings: authentication is required", () => {
  it("rejects an unauthenticated request (401)", async () => {
    const res = await request("/api/v1/learnings");
    expect(res.status).toBe(401);
  });
});
