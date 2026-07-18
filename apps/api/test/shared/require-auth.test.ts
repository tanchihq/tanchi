import { beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { AppError } from "@shared/errors";
import {
  requireAuth,
  type AuthVariables,
} from "@shared/middleware/requireAuth.ts";
import { createAccount } from "../helpers/client.ts";
import { truncateAll } from "../helpers/db.ts";

function buildGatedApp(requireVerifiedEmail: boolean) {
  return new Hono<{ Variables: AuthVariables }>()
    .onError((error, context) => {
      if (error instanceof AppError) {
        return context.json(error.toJSON(), error.statusCode as 401 | 403);
      }
      throw error;
    })
    .get("/protected", requireAuth({ requireVerifiedEmail }), (context) =>
      context.json({ userId: context.get("user").id })
    );
}

beforeEach(truncateAll);

describe("requireAuth: email verification gate", () => {
  it("rejects an unverified session with 403 emailNotVerified when the gate is on", async () => {
    const account = await createAccount();
    const app = buildGatedApp(true);
    const response = await app.fetch(
      new Request("http://localhost/protected", {
        headers: { cookie: account.cookie },
      })
    );
    expect(response.status).toBe(403);
    expect((await response.json()).message).toBe("emailNotVerified");
  });

  it("accepts an unverified session when the gate is off", async () => {
    const account = await createAccount();
    const app = buildGatedApp(false);
    const response = await app.fetch(
      new Request("http://localhost/protected", {
        headers: { cookie: account.cookie },
      })
    );
    expect(response.status).toBe(200);
    expect((await response.json()).userId).toBe(account.userId);
  });

  it("still rejects anonymous requests with 401 regardless of the gate", async () => {
    const app = buildGatedApp(true);
    const response = await app.fetch(
      new Request("http://localhost/protected")
    );
    expect(response.status).toBe(401);
  });
});
