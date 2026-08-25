import { beforeEach, describe, expect, it } from "bun:test";
import {
  authedRequest,
  createAccount,
  jsonRequest,
  request,
} from "../helpers/client.ts";
import { db, truncateAll } from "../helpers/db.ts";
import { auth } from "@shared/auth";
import { OnboardingService } from "../../src/modules/onboarding/onboarding.service.ts";
import { SignUpErrors } from "../../src/modules/onboarding/onboarding.errors.ts";
import { OnboardingRepository } from "../../src/modules/onboarding/repository/onboarding/onboarding.repository.ts";
import { OnboardingPostgres } from "../../src/modules/onboarding/repository/onboarding/onboarding.postgres.ts";

const SIGN_UP_PATH = "/api/v1/onboarding/sign-up";
const STATE_PATH = "/api/v1/onboarding/state";
const PROGRESS_PATH = "/api/v1/onboarding/progress";
const COMPLETE_PATH = "/api/v1/onboarding/complete";
const GENERATE_PROFILE_PATH = "/api/v1/onboarding/generate-profile";

const VALID_PASSWORD = "TestPassword12345";
const MAX_DRAFT_ICPS = 10;
const MAX_ICPS = 3;
const MAX_STEP = 2;
const SIGN_UP_RATE_LIMIT = 10;

type SignUpBody = Readonly<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
}>;

const signUpPayload = (
  overrides: Partial<SignUpBody> = {}
): SignUpBody => {
  const unique = Bun.randomUUIDv7();
  return {
    email: `owner-${unique}@example.test`,
    password: VALID_PASSWORD,
    firstName: "Ada",
    lastName: "Lovelace",
    company: `Analytical ${unique}`,
    ...overrides,
  };
};

const signUp = (body: SignUpBody, ip: string = `ip-${Bun.randomUUIDv7()}`) =>
  request(SIGN_UP_PATH, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });

const validIcp = () => ({
  name: "Founders",
  archetype: "Early-stage B2B SaaS",
  description: "Founders who own their pipeline",
  perceivedValue: "More qualified meetings",
  angle: "Time saved on prospecting",
  goldenRule: "Never fabricate a fact",
});

const validMarket = () => ({
  name: "United States",
  country: "US",
  outreachLanguage: "en",
});

const validCompletePayload = () => ({
  market: validMarket(),
  companyName: "Acme Corp",
  website: "https://acme.test",
  companyProfile: "We help teams sell better.",
  icps: [validIcp()],
});

beforeEach(truncateAll);

describe("onboarding sign-up: happy path and response contract", () => {
  it("creates user + org and returns 201 with a session cookie", async () => {
    const body = signUpPayload();
    const res = await signUp(body);
    expect(res.status).toBe(201);
    expect(res.headers.getSetCookie().length).toBeGreaterThan(0);

    const payload = (await res.json()) as Readonly<{
      user: Readonly<{ id: string; email: string; name: string }>;
      organization: Readonly<{ id: string; name: string; slug: string }>;
    }>;
    expect(payload.user.id).toBeString();
    expect(payload.user.email).toBe(body.email);
    expect(payload.user.name).toBe(`${body.firstName} ${body.lastName}`);
    expect(payload.organization.id).toBeString();
    expect(payload.organization.name).toBe(body.company);
    expect(payload.organization.slug).toBeString();
  });

  it("never leaks the password in the response body", async () => {
    const body = signUpPayload();
    const res = await signUp(body);
    expect(res.status).toBe(201);
    expect(JSON.stringify(await res.json())).not.toContain(body.password);
  });

  it("is public: succeeds without any authentication", async () => {
    const res = await signUp(signUpPayload());
    expect(res.status).toBe(201);
  });
});

describe("onboarding sign-up: validation enforces SignUpDto bounds", () => {
  it("rejects a password shorter than MIN_PASSWORD_LENGTH=12 (400 invalidPassword)", async () => {
    const res = await signUp(signUpPayload({ password: "short12345" }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidPassword");
  });

  it("rejects a malformed email (400 invalidEmail)", async () => {
    const res = await signUp(signUpPayload({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidEmail");
  });

  it("rejects a whitespace-only firstName (400 invalidFirstName)", async () => {
    const res = await signUp(signUpPayload({ firstName: "   " }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidFirstName");
  });

  it("rejects a blank lastName (400 invalidLastName)", async () => {
    const res = await signUp(signUpPayload({ lastName: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidLastName");
  });

  it("rejects a whitespace-only company (400 invalidCompany)", async () => {
    const res = await signUp(signUpPayload({ company: "  \t  " }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidCompany");
  });

  it("returns 400 (never 422) for a zod validation failure", async () => {
    const res = await signUp(signUpPayload({ email: "nope" }));
    expect(res.status).toBe(400);
    expect(res.status).not.toBe(422);
  });
});

describe("onboarding sign-up: duplicate email", () => {
  it("rejects a duplicate email with 409 emailAlreadyExists", async () => {
    const first = signUpPayload();
    const created = await signUp(first);
    expect(created.status).toBe(201);

    const dup = await signUp(signUpPayload({ email: first.email }));
    expect(dup.status).toBe(409);
    expect((await dup.json()).message).toBe("emailAlreadyExists");
  });
});

describe("onboarding sign-up: rate limiting per client", () => {
  it("returns 429 rateLimited after SIGN_UP_RATE_LIMIT=10 attempts from the same client", async () => {
    const ip = `ratelimit-${Bun.randomUUIDv7()}`;
    const allowed = await Promise.all(
      Array.from({ length: SIGN_UP_RATE_LIMIT }, () =>
        signUp(signUpPayload(), ip)
      )
    );
    allowed.map((res) => expect(res.status).toBe(201));

    const blocked = await signUp(signUpPayload(), ip);
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).message).toBe("rateLimited");
  });

  it("does not throttle sign-ups coming from distinct clients", async () => {
    const first = await signUp(signUpPayload());
    const second = await signUp(signUpPayload());
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });
});

describe("onboarding sign-up: DISABLE_SIGNUP flag", () => {
  it("returns signupDisabled without creating the user when signup is disabled", async () => {
    const disabledService = new OnboardingService(
      auth,
      new OnboardingRepository(new OnboardingPostgres(db)),
      true
    );
    const body = signUpPayload();
    const result = await disabledService.signUp(body);
    expect(result).toBe(SignUpErrors.signupDisabled);

    const stillAvailable = await signUp(body);
    expect(stillAvailable.status).toBe(201);
  });
});

describe("onboarding: authentication is required on protected routes", () => {
  it("rejects GET /state without a cookie (401)", async () => {
    expect((await request(STATE_PATH)).status).toBe(401);
  });

  it("rejects PUT /progress without a cookie (401)", async () => {
    const res = await jsonRequest(PROGRESS_PATH, null, "PUT", {
      step: 1,
      draft: {},
    });
    expect(res.status).toBe(401);
  });

  it("rejects POST /complete without a cookie (401)", async () => {
    const res = await jsonRequest(
      COMPLETE_PATH,
      null,
      "POST",
      validCompletePayload()
    );
    expect(res.status).toBe(401);
  });

  it("rejects POST /generate-profile without a cookie (401)", async () => {
    const res = await jsonRequest(GENERATE_PROFILE_PATH, null, "POST", {
      website: "https://acme.test",
    });
    expect(res.status).toBe(401);
  });
});

describe("onboarding state: default and org scoping", () => {
  it("returns an in-progress default state for a fresh org", async () => {
    const account = await createAccount();
    const res = await authedRequest(STATE_PATH, account.cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Readonly<{
      status: string;
      step: number;
      draft: Readonly<{ icps: ReadonlyArray<unknown> }>;
    }>;
    expect(body.status).toBe("in_progress");
    expect(body.step).toBe(0);
    expect(Array.isArray(body.draft.icps)).toBe(true);
  });

  it("does not surface another org's saved draft (tenant isolation)", async () => {
    const owner = await createAccount();
    const other = await createAccount();
    const saved = await jsonRequest(PROGRESS_PATH, owner.cookie, "PUT", {
      step: 1,
      draft: { companyName: "Owner Secret Co" },
    });
    expect(saved.status).toBe(200);

    const otherState = await authedRequest(STATE_PATH, other.cookie);
    const body = (await otherState.json()) as Readonly<{
      draft: Readonly<{ companyName: string }>;
    }>;
    expect(body.draft.companyName).not.toBe("Owner Secret Co");
  });
});

describe("onboarding save-progress: persistence and validation", () => {
  it("persists a valid draft and GET /state reflects it", async () => {
    const account = await createAccount();
    const res = await jsonRequest(PROGRESS_PATH, account.cookie, "PUT", {
      step: 1,
      draft: {
        companyName: "Persisted Co",
        website: "https://persisted.test",
        icps: [{ name: "Ops leads" }],
      },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe(true);

    const state = await authedRequest(STATE_PATH, account.cookie);
    const body = (await state.json()) as Readonly<{
      step: number;
      draft: Readonly<{
        companyName: string;
        website: string;
        icps: ReadonlyArray<Readonly<{ name: string }>>;
      }>;
    }>;
    expect(body.step).toBe(1);
    expect(body.draft.companyName).toBe("Persisted Co");
    expect(body.draft.website).toBe("https://persisted.test");
    expect(body.draft.icps[0]?.name).toBe("Ops leads");
  });

  it("rejects a draft with more than MAX_DRAFT_ICPS=10 icps (400 invalidDraft)", async () => {
    const account = await createAccount();
    const icps = Array.from({ length: MAX_DRAFT_ICPS + 1 }, () => ({
      name: "x",
    }));
    const res = await jsonRequest(PROGRESS_PATH, account.cookie, "PUT", {
      step: 1,
      draft: { icps },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidDraft");
  });

  it("rejects a non-integer step per the declared int bound (400 invalidDraft)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(PROGRESS_PATH, account.cookie, "PUT", {
      step: 1.5,
      draft: {},
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidDraft");
  });

  it("clamps an out-of-range step to MAX_STEP=2 (no declared upper bound, service clamps)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(PROGRESS_PATH, account.cookie, "PUT", {
      step: 99,
      draft: {},
    });
    expect(res.status).toBe(200);

    const state = await authedRequest(STATE_PATH, account.cookie);
    expect((await state.json()).step).toBe(MAX_STEP);
  });
});

describe("onboarding generate-profile", () => {
  it("returns 200 with the generated company profile (mocked)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      GENERATE_PROFILE_PATH,
      account.cookie,
      "POST",
      { market: validMarket(), website: "https://acme.test", companyName: "Acme" }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).companyProfile).toBeString();
  });

  it("rejects a malformed website (400 invalidWebsite)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      GENERATE_PROFILE_PATH,
      account.cookie,
      "POST",
      { market: validMarket(), website: "not-a-url" }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidWebsite");
  });
});

describe("onboarding complete: persistence and validation", () => {
  it("completes onboarding (200) and marks the state completed", async () => {
    const account = await createAccount();
    const res = await jsonRequest(
      COMPLETE_PATH,
      account.cookie,
      "POST",
      validCompletePayload()
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe(true);

    const state = await authedRequest(STATE_PATH, account.cookie);
    const body = (await state.json()) as Readonly<{
      status: string;
      step: number;
    }>;
    expect(body.status).toBe("completed");
    expect(body.step).toBe(MAX_STEP);
  });

  it("rejects a malformed website (400 invalidWebsite)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(COMPLETE_PATH, account.cookie, "POST", {
      ...validCompletePayload(),
      website: "not-a-url",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidWebsite");
  });

  it("rejects more than MAX_ICPS=3 icps (400 tooManyIcps)", async () => {
    const account = await createAccount();
    const icps = Array.from({ length: MAX_ICPS + 1 }, () => validIcp());
    const res = await jsonRequest(COMPLETE_PATH, account.cookie, "POST", {
      ...validCompletePayload(),
      icps,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("tooManyIcps");
  });

  it("rejects an empty icps list per the min(1) bound (400 invalidIcp)", async () => {
    const account = await createAccount();
    const res = await jsonRequest(COMPLETE_PATH, account.cookie, "POST", {
      ...validCompletePayload(),
      icps: [],
    });
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("invalidIcp");
  });
});
