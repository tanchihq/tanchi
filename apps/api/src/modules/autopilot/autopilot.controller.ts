import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { AutopilotService } from "./autopilot.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  GetAutopilotErrors,
  UpdateAutopilotErrors,
} from "./autopilot.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createAutopilotRouter(autopilotService: AutopilotService) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await autopilotService.getAutopilot(
        session.activeOrganizationId
      );

      switch (result) {
        case GetAutopilotErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    })
    .put(
      "/",
      requireAuth(),
      zValidator("json", RequestDto.UpdateAutopilotDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await autopilotService.updateAutopilot(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case UpdateAutopilotErrors.invalidEnabled:
            return sendError(context, 400, result);
          case UpdateAutopilotErrors.noActiveOrganization:
          case UpdateAutopilotErrors.notOnboarded:
            return sendError(context, 409, result);
          case UpdateAutopilotErrors.updateFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    );
}
