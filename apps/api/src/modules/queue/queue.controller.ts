import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { captureEvent } from "@shared/analytics";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { QueueService } from "./queue.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  EditQueueErrors,
  GetQueueErrors,
  ValidateQueueErrors,
} from "./queue.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createQueueRouter(queueService: QueueService) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await queueService.getQueue(
        session.activeOrganizationId
      );

      switch (result) {
        case GetQueueErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    })
    .patch(
      "/:id",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: EditQueueErrors.invalidProspectId }),
        }),
        zodValidationHook
      ),
      zValidator("json", RequestDto.EditQueueDto, zodValidationHook),
      async (context) => {
        const { id } = context.req.valid("param");
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await queueService.editQueue(
          id,
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case EditQueueErrors.inexistingDraft:
            return sendError(context, 404, result);
          case EditQueueErrors.notInMyOrg:
            return sendError(context, 403, result);
          case EditQueueErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case EditQueueErrors.editFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    )
    .post(
      "/:id/validate",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: ValidateQueueErrors.invalidProspectId }),
        }),
        zodValidationHook
      ),
      zValidator(
        "query",
        z.object({ senderId: z.uuid().optional() }),
        zodValidationHook
      ),
      async (context) => {
        const { id } = context.req.valid("param");
        const { senderId } = context.req.valid("query");
        const session = context.get("session") as SessionOrganization;
        const result = await queueService.validateQueueItem(
          id,
          session.activeOrganizationId,
          senderId
        );

        switch (result) {
          case ValidateQueueErrors.inexistingDraft:
            return sendError(context, 404, result);
          case ValidateQueueErrors.notInMyOrg:
            return sendError(context, 403, result);
          case ValidateQueueErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case ValidateQueueErrors.noSender:
            return sendError(context, 422, result);
          case ValidateQueueErrors.sendFailed:
            return sendError(context, 500, result);
        }

        if (typeof result !== "string") {
          captureEvent({
            distinctId: context.get("user").id,
            event: "outreach_message_sent",
            properties: { channel: result.channel },
          });
        }
        return context.json(result);
      }
    );
}
