import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { ActivityService } from "./activity.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import { GetActivityErrors } from "./activity.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createActivityRouter(activityService: ActivityService) {
  return new Hono<{ Variables: AuthVariables }>()
    .get(
      "/",
      requireAuth(),
      zValidator("query", RequestDto.GetActivityDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("query");
        const session = context.get("session") as SessionOrganization;
        const result = await activityService.getActivity(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case GetActivityErrors.noActiveOrganization:
            return sendError(context, 409, result);
        }

        return context.json(result);
      }
    )
    .get("/status", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await activityService.getStatus(
        session.activeOrganizationId
      );

      switch (result) {
        case GetActivityErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    });
}
