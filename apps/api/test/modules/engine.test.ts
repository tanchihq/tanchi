import { beforeEach, describe, expect, it } from "bun:test";
import { authedRequest, createAccount, request } from "../helpers/client.ts";
import { truncateAll } from "../helpers/db.ts";
import { ANALYSTE_RATE_LIMIT } from "../../src/modules/engine/engine.constants.ts";

const postEngine = (path: string, cookie: string): Promise<Response> =>
  authedRequest(path, cookie, { method: "POST" });

beforeEach(truncateAll);

describe("engine: enqueue contract for an authed active org", () => {
  it("POST /run returns 202 { queued: true }", async () => {
    const account = await createAccount();
    const res = await postEngine("/api/v1/engine/run", account.cookie);
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ queued: true });
  });

  it("POST /analyste returns 202 { queued: true }", async () => {
    const account = await createAccount();
    const res = await postEngine("/api/v1/engine/analyste", account.cookie);
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ queued: true });
  });
});

describe("engine: authentication is required on every route", () => {
  it("POST /run rejects an unauthenticated caller (401)", async () => {
    const res = await request("/api/v1/engine/run", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /analyste rejects an unauthenticated caller (401)", async () => {
    const res = await request("/api/v1/engine/analyste", { method: "POST" });
    expect(res.status).toBe(401);
  });
});

describe("engine: rate limit on /analyste (ANALYSTE_RATE_LIMIT=10)", () => {
  it("allows the first 10 (202) and blocks the 11th (429 rateLimited)", async () => {
    const account = await createAccount();
    const attempts = Array.from(
      { length: ANALYSTE_RATE_LIMIT + 1 },
      (_, index) => index
    );
    const statuses = await attempts.reduce<Promise<ReadonlyArray<number>>>(
      async (accumulator) => {
        const collected = await accumulator;
        const res = await postEngine("/api/v1/engine/analyste", account.cookie);
        return [...collected, res.status];
      },
      Promise.resolve([])
    );

    const allowed = statuses.slice(0, ANALYSTE_RATE_LIMIT);
    const blocked = statuses[ANALYSTE_RATE_LIMIT];
    expect(allowed).toEqual(Array.from({ length: ANALYSTE_RATE_LIMIT }, () => 202));
    expect(blocked).toBe(429);

    const eleventh = await postEngine("/api/v1/engine/analyste", account.cookie);
    expect(eleventh.status).toBe(429);
    expect((await eleventh.json()).message).toBe("rateLimited");
  });
});
