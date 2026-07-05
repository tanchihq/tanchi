import { Hono } from "hono";
import type { Queue } from "bullmq";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { RunEngineErrors } from "./engine.errors.ts";
import type * as ResponseDto from "./dto/response/index.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createEngineRouter(engineQueue: Queue) {
  return new Hono<{ Variables: AuthVariables }>().post(
    "/run",
    requireAuth(),
    async (context) => {
      const session = context.get("session") as SessionOrganization;
      const organizationId = session.activeOrganizationId;
      if (
        organizationId === null ||
        organizationId === undefined ||
        organizationId === ""
      ) {
        return sendError(context, 409, RunEngineErrors.noActiveOrganization);
      }

      await engineQueue.add(
        "manual",
        { organizationId },
        { removeOnComplete: true, removeOnFail: 100 }
      );

      const body: ResponseDto.EngineRunQueuedDto = { queued: true };
      return context.json(body, 202);
    }
  );
}
