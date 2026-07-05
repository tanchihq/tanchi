import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { MessagesService } from "./messages.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import { GetMessagesErrors } from "./messages.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createMessagesRouter(messagesService: MessagesService) {
  return new Hono<{ Variables: AuthVariables }>().get(
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
  );
}
