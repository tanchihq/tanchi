import { beforeEach, describe, expect, it } from "bun:test";
import {
  authedRequest,
  createAccount,
  jsonRequest,
  request,
} from "../helpers/client.ts";
import { truncateAll } from "../helpers/db.ts";

const validUpdatePayload = () =>
  ({
    company: { name: "AlphaCorp", website: "https://alpha.test" },
    resources: {
      productPageUrl: "https://alpha.test/product",
      salesDeckUrl: null,
    },
    outreachLanguage: "en",
    companyProfile: "We help teams ship faster.",
    followUp: { intervals: [3, 5], excludedWeekdays: [0, 6] },
    leadsPerDay: 42,
    icps: [
      {
        name: "CTOs",
        archetype: "technical leader",
        description: "Technical decision makers at mid-market SaaS.",
        perceivedValue: "engineering time saved",
        angle: "developer efficiency",
        goldenRule: "stay concise",
      },
    ],
  }) as const;

const updateSettings = async (cookie: string, body: unknown) =>
  jsonRequest("/api/v1/settings", cookie, "PUT", body);

beforeEach(truncateAll);

describe("settings: GET returns the active organization settings (response contract)", () => {
  it("returns the SettingsDto shape for the caller's organization", async () => {
    const account = await createAccount();
    const res = await authedRequest("/api/v1/settings", account.cookie);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.company.name).toBeString();
    expect(body.company.name.length).toBeGreaterThan(0);
    expect(body.company.website).toBeString();
    expect(body.resources.productPageUrl).toBeString();
    expect(body.resources.salesDeckUrl).toBeString();
    expect(body.outreachLanguage).toBeString();
    expect(body.companyProfile).toBeString();
    expect(body.followUp.intervals).toBeArray();
    expect(body.followUp.excludedWeekdays).toBeArray();
    expect(body.leadsPerDay).toBeNumber();
    expect(body.icps).toBeArray();
  });
});

describe("settings: update happy path round-trips through the response DTO", () => {
  it("persists a full valid payload (200) and GET reflects it", async () => {
    const account = await createAccount();
    const res = await updateSettings(account.cookie, validUpdatePayload());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.company.name).toBe("AlphaCorp");
    expect(body.company.website).toBe("https://alpha.test");
    expect(body.resources.productPageUrl).toBe("https://alpha.test/product");
    expect(body.resources.salesDeckUrl).toBe("");
    expect(body.outreachLanguage).toBe("en");
    expect(body.companyProfile).toBe("We help teams ship faster.");
    expect(body.followUp.intervals).toEqual([3, 5]);
    expect(body.followUp.excludedWeekdays).toEqual([0, 6]);
    expect(body.leadsPerDay).toBe(42);
    expect(body.icps.length).toBe(1);
    expect(body.icps[0].name).toBe("CTOs");
    expect(body.icps[0].description).toBe(
      "Technical decision makers at mid-market SaaS."
    );

    const reread = await authedRequest("/api/v1/settings", account.cookie);
    expect((await reread.json())).toEqual(body);
  });
});

describe("settings: update enforces the declared DTO bounds (all zod failures => 400)", () => {
  it("rejects leadsPerDay above MAX_LEADS_PER_DAY=200 (400 invalidLeadsPerDay)", async () => {
    const account = await createAccount();
    const res = await updateSettings(account.cookie, {
      ...validUpdatePayload(),
      leadsPerDay: 201,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidLeadsPerDay");
  });

  it("rejects leadsPerDay below MIN_LEADS_PER_DAY=1 (400 invalidLeadsPerDay)", async () => {
    const account = await createAccount();
    const res = await updateSettings(account.cookie, {
      ...validUpdatePayload(),
      leadsPerDay: 0,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidLeadsPerDay");
  });

  it("rejects more than MAX_ICPS=3 icps (400 tooManyIcps)", async () => {
    const account = await createAccount();
    const oneIcp = validUpdatePayload().icps[0];
    const res = await updateSettings(account.cookie, {
      ...validUpdatePayload(),
      icps: [oneIcp, oneIcp, oneIcp, oneIcp],
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("tooManyIcps");
  });

  it("rejects a company name longer than MAX_COMPANY_NAME_LENGTH=200 (400 invalidCompanyName)", async () => {
    const account = await createAccount();
    const res = await updateSettings(account.cookie, {
      ...validUpdatePayload(),
      company: { name: "x".repeat(201), website: "https://alpha.test" },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidCompanyName");
  });

  it("rejects a malformed website URL (400 invalidWebsite)", async () => {
    const account = await createAccount();
    const res = await updateSettings(account.cookie, {
      ...validUpdatePayload(),
      company: { name: "AlphaCorp", website: "not-a-url" },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidWebsite");
  });

  it("rejects a follow-up interval above MAX_FOLLOW_UP_INTERVAL_DAYS=60 (400 invalidFollowUp)", async () => {
    const account = await createAccount();
    const res = await updateSettings(account.cookie, {
      ...validUpdatePayload(),
      followUp: { intervals: [61], excludedWeekdays: [0, 6] },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidFollowUp");
  });

  it("never answers a validation failure with 422", async () => {
    const account = await createAccount();
    const res = await updateSettings(account.cookie, {
      ...validUpdatePayload(),
      leadsPerDay: 9999,
    });
    expect(res.status).not.toBe(422);
    expect(res.status).toBe(400);
  });
});

describe("settings: generate-profile returns the (mocked) profile", () => {
  it("returns 200 with the mocked company profile", async () => {
    const account = await createAccount();
    const res = await authedRequest(
      "/api/v1/settings/generate-profile",
      account.cookie,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).companyProfile).toBe("Mock company profile.");
  });
});

describe("settings: multi-tenant isolation (product invariant #1)", () => {
  it("one organization's update never affects another organization's settings", async () => {
    const alpha = await createAccount();
    const beta = await createAccount();

    const betaBefore = await (
      await authedRequest("/api/v1/settings", beta.cookie)
    ).json();

    const applied = await updateSettings(alpha.cookie, validUpdatePayload());
    expect(applied.status).toBe(200);

    const alphaAfter = await (
      await authedRequest("/api/v1/settings", alpha.cookie)
    ).json();
    expect(alphaAfter.company.name).toBe("AlphaCorp");
    expect(alphaAfter.leadsPerDay).toBe(42);

    const betaAfter = await (
      await authedRequest("/api/v1/settings", beta.cookie)
    ).json();
    expect(betaAfter).toEqual(betaBefore);
    expect(betaAfter.company.name).not.toBe("AlphaCorp");
  });
});

describe("settings: authentication is required on every route", () => {
  it("rejects an unauthenticated GET (401)", async () => {
    expect((await request("/api/v1/settings")).status).toBe(401);
  });

  it("rejects an unauthenticated PUT (401)", async () => {
    const res = await jsonRequest(
      "/api/v1/settings",
      null,
      "PUT",
      validUpdatePayload()
    );
    expect(res.status).toBe(401);
  });

  it("rejects an unauthenticated generate-profile (401)", async () => {
    const res = await request("/api/v1/settings/generate-profile", {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });
});
