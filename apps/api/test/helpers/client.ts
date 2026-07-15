import { app } from "../../src/index.ts";

const DEFAULT_PASSWORD = "TestPassword12345";

export type Account = Readonly<{
  cookie: string;
  userId: string;
  organizationId: string;
  email: string;
}>;

export async function request(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return app.fetch(new Request(`http://localhost${path}`, init));
}

export function authedRequest(
  path: string,
  cookie: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("cookie", cookie);
  return request(path, { ...init, headers });
}

export function jsonRequest(
  path: string,
  cookie: string | null,
  method: string,
  body: unknown
): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie !== null) headers.set("cookie", cookie);
  return request(path, { method, headers, body: JSON.stringify(body) });
}

export async function createAccount(): Promise<Account> {
  const unique = Bun.randomUUIDv7();
  const email = `user-${unique}@example.test`;
  const signUp = await request("/api/v1/onboarding/sign-up", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `account-${unique}`,
    },
    body: JSON.stringify({
      email,
      password: DEFAULT_PASSWORD,
      firstName: "Test",
      lastName: "User",
      company: `Acme ${unique}`,
    }),
  });
  if (signUp.status !== 201) {
    throw new Error(
      `sign-up failed (${signUp.status}): ${await signUp.text()}`
    );
  }
  const cookie = signUp.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  const me = await authedRequest("/api/v1/me", cookie);
  if (me.status !== 200) {
    throw new Error(`/me failed (${me.status}): ${await me.text()}`);
  }
  const payload = (await me.json()) as Readonly<{
    user: Readonly<{ id: string }>;
    session: Readonly<{ activeOrganizationId: string }>;
  }>;
  return {
    cookie,
    userId: payload.user.id,
    organizationId: payload.session.activeOrganizationId,
    email,
  };
}
