import { Hono } from "hono";
import type { Queue } from "bullmq";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { RunEngineErrors } from "./engine.errors.ts";
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
    .post("/run", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const organizationId = resolveActiveOrganization(session);
      if (organizationId === null) {
        return sendError(context, 409, RunEngineErrors.noActiveOrganization);
      }

      await engineQueue.add(
        "manual",
        { organizationId },
        { removeOnComplete: true, removeOnFail: 100 }
      );

      const body: ResponseDto.EngineRunQueuedDto = { queued: true };
      return context.json(body, 202);
    })
    .post("/analyste", requireAuth(), async (context) => {
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
