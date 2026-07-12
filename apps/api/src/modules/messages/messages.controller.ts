import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { MessagesService } from "./messages.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import { EditMessageErrors, GetMessagesErrors } from "./messages.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createMessagesRouter(messagesService: MessagesService) {
  return new Hono<{ Variables: AuthVariables }>()
    .get(
      "/",
      requireAuth(),
      zValidator("query", RequestDto.GetMessagesDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("query");
        const session = context.get("session") as SessionOrganization;
        const result = await messagesService.getMessages(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case GetMessagesErrors.noActiveOrganization:
            return sendError(context, 409, result);
        }

        return context.json(result);
      }
    )
    .patch(
      "/:id",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: EditMessageErrors.invalidMessageId }),
        }),
        zodValidationHook
      ),
      zValidator("json", RequestDto.EditMessageDto, zodValidationHook),
      async (context) => {
        const { id } = context.req.valid("param");
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await messagesService.editMessage(
          id,
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case EditMessageErrors.inexistingMessage:
            return sendError(context, 404, result);
          case EditMessageErrors.notInMyOrg:
            return sendError(context, 403, result);
          case EditMessageErrors.notEditable:
            return sendError(context, 422, result);
          case EditMessageErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case EditMessageErrors.updateFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    );
}
