import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AppError, sendError, type HttpErrorStatus } from "@shared/errors";
import { auth } from "@shared/auth";
import { requireAuth } from "@shared/middleware/requireAuth.ts";
import { onboardingRouter } from "./modules/onboarding/onboarding.module.ts";
import { env } from "./env.ts";

const HTTP_INTERNAL_SERVER_ERROR = 500;

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [env.APP_URL],
    credentials: true,
  })
);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return sendError(c, err.statusCode as HttpErrorStatus, err.message);
  }
  console.error("[Unhandled error]", err);
  return sendError(
    c,
    HTTP_INTERNAL_SERVER_ERROR,
    "An unexpected error occurred"
  );
});

app.get("/", (c) => c.json({ name: "sweeleads-api", version: "0.1.0" }));

const api = new Hono();

api.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));

api.route("/onboarding", onboardingRouter);

api.get("/me", requireAuth(), (c) =>
  c.json({ user: c.get("user"), session: c.get("session") })
);

app.route("/api/v1", api);

console.log(`🚀 sweeleads-api running on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
