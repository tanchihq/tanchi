import { Hono } from "hono";
import type { Queue } from "bullmq";
import { getBillingAccess } from "@shared/billing";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { rateLimit } from "@shared/ratelimit";
import { RunEngineErrors } from "./engine.errors.ts";
import {
  ANALYSTE_RATE_LIMIT,
  ENGINE_RATE_LIMIT_WINDOW_SECONDS,
  ENGINE_RUN_RATE_LIMIT,
} from "./engine.constants.ts";
import type * as ResponseDto from "./dto/response/index.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

function resolveActiveOrganization(
  session: SessionOrganization
): string | null {
  const organizationId = session.activeOrganizationId;
  if (
    organizationId === null ||
    organizationId === undefined ||
    organizationId === ""
  ) {
    return null;
  }
  return organizationId;
}

export function createEngineRouter(engineQueue: Queue, analysteQueue: Queue) {
  return new Hono<{ Variables: AuthVariables }>()
    .post(
      "/run",
      requireAuth(),
      rateLimit({
        name: "engine-run",
        limit: ENGINE_RUN_RATE_LIMIT,
        windowSeconds: ENGINE_RATE_LIMIT_WINDOW_SECONDS,
      }),
      async (context) => {
      const session = context.get("session") as SessionOrganization;
      const organizationId = resolveActiveOrganization(session);
      if (organizationId === null) {
        return sendError(context, 409, RunEngineErrors.noActiveOrganization);
      }

      const access = await getBillingAccess(organizationId);
      if (access.state === "expired") {
        return sendError(context, 403, RunEngineErrors.subscriptionExpired);
      }

      await engineQueue.add(
        "manual",
        { organizationId },
        { removeOnComplete: true, removeOnFail: 100 }
      );

      const body: ResponseDto.EngineRunQueuedDto = { queued: true };
      return context.json(body, 202);
    })
    .post(
      "/analyste",
      requireAuth(),
      rateLimit({
        name: "engine-analyste",
        limit: ANALYSTE_RATE_LIMIT,
        windowSeconds: ENGINE_RATE_LIMIT_WINDOW_SECONDS,
      }),
      async (context) => {
      const session = context.get("session") as SessionOrganization;
      const organizationId = resolveActiveOrganization(session);
      if (organizationId === null) {
        return sendError(context, 409, RunEngineErrors.noActiveOrganization);
      }

      await analysteQueue.add(
        "manual",
        { organizationId },
        { removeOnComplete: true, removeOnFail: 100 }
      );

      const body: ResponseDto.EngineRunQueuedDto = { queued: true };
      return context.json(body, 202);
    });
}
