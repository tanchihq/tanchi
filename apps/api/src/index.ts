import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { shutdownAnalytics } from "@shared/analytics";
import { AppError, sendError, type HttpErrorStatus } from "@shared/errors";
import { auth } from "@shared/auth";
import { requireAuth } from "@shared/middleware/requireAuth.ts";
import { onboardingRouter } from "./modules/onboarding/onboarding.module.ts";
import { settingsRouter } from "./modules/settings/settings.module.ts";
import { learningsRouter } from "./modules/learnings/learnings.module.ts";
import { sendersRouter } from "./modules/senders/senders.module.ts";
import { prospectsRouter } from "./modules/prospects/prospects.module.ts";
import { queueRouter } from "./modules/queue/queue.module.ts";
import { engineRouter, startEngineWorkers } from "./modules/engine/engine.module.ts";
import { startRewardWorkers } from "./modules/reward/reward.module.ts";
import { startSequencesWorkers } from "./modules/sequences/sequences.module.ts";
import { activityRouter } from "./modules/activity/activity.module.ts";
import { suppressionRouter } from "./modules/suppression/suppression.module.ts";
import { messagesRouter } from "./modules/messages/messages.module.ts";
import { chatRouter } from "./modules/chat/chat.module.ts";
import { billingRouter } from "./modules/billing/billing.module.ts";
import { closeQueues } from "@shared/queue";
import { closeRateLimit, rateLimit } from "@shared/ratelimit";
import { env } from "./env.ts";

const HTTP_INTERNAL_SERVER_ERROR = 500;
const AUTH_RATE_WINDOW_SECONDS = 900;
const AUTH_SIGN_IN_LIMIT = 10;
const AUTH_RESET_LIMIT = 5;

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

app.get("/", (c) => c.json({ name: "tanchi-api", version: "0.1.0" }));

const api = new Hono();

api.use(
  "/auth/sign-in/email",
  rateLimit({
    name: "auth-sign-in",
    limit: AUTH_SIGN_IN_LIMIT,
    windowSeconds: AUTH_RATE_WINDOW_SECONDS,
    keyBy: "ip",
    failClosed: true,
  })
);
api.use(
  "/auth/forget-password",
  rateLimit({
    name: "auth-forget-password",
    limit: AUTH_RESET_LIMIT,
    windowSeconds: AUTH_RATE_WINDOW_SECONDS,
    keyBy: "ip",
    failClosed: true,
  })
);
api.use(
  "/auth/reset-password",
  rateLimit({
    name: "auth-reset-password",
    limit: AUTH_RESET_LIMIT,
    windowSeconds: AUTH_RATE_WINDOW_SECONDS,
    keyBy: "ip",
    failClosed: true,
  })
);

api.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));

api.route("/onboarding", onboardingRouter);
api.route("/settings", settingsRouter);
api.route("/learnings", learningsRouter);
api.route("/senders", sendersRouter);
api.route("/prospects", prospectsRouter);
api.route("/queue", queueRouter);
api.route("/engine", engineRouter);
api.route("/activity", activityRouter);
api.route("/suppression", suppressionRouter);
api.route("/messages", messagesRouter);
api.route("/chat", chatRouter);
api.route("/billing", billingRouter);

api.get("/me", requireAuth({ requireVerifiedEmail: false }), (c) =>
  c.json({ user: c.get("user"), session: c.get("session") })
);

app.route("/api/v1", api);

export { app };

if (env.RUN_WORKERS === "true") {
  startEngineWorkers();
  startRewardWorkers();
  startSequencesWorkers();
  console.log("[workers] engine-nightly + reward-poll + sequences started");
}

const shutdown = async (signal: string): Promise<void> => {
  console.log(`[shutdown] ${signal} received, closing queues...`);
  await Promise.all([closeQueues(), closeRateLimit(), shutdownAnalytics()]);
  process.exit(0);
};
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

console.log(`🚀 tanchi-api running on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  idleTimeout: 255,
  fetch: app.fetch,
};
