import { Hono } from "hono";
import { z } from "zod";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { rateLimit } from "@shared/ratelimit";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { ChatService } from "./chat.service.ts";
import {
  CHAT_MESSAGE_RATE_LIMIT,
  CHAT_RATE_LIMIT_WINDOW_SECONDS,
} from "./chat.constants.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  AttachLeadErrors,
  CreateConversationErrors,
  DeleteConversationErrors,
  DetachLeadErrors,
  GetConversationErrors,
  GetConversationsErrors,
} from "./chat.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

const conversationParam = z.object({
  id: z.uuid({ message: GetConversationErrors.invalidConversationId }),
});

export function createChatRouter(chatService: ChatService) {
  return new Hono<{ Variables: AuthVariables }>()
    .post(
      "/",
      requireAuth(),
      zValidator("json", RequestDto.CreateConversationDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await chatService.createConversation(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case CreateConversationErrors.invalidTitle:
            return sendError(context, 400, result);
          case CreateConversationErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case CreateConversationErrors.createFailed:
            return sendError(context, 500, result);
        }

        return context.json(result, 201);
      }
    )
    .get("/", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await chatService.getConversations(
        session.activeOrganizationId
      );

      switch (result) {
        case GetConversationsErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    })
    .get(
      "/:id",
      requireAuth(),
      zValidator("param", conversationParam, zodValidationHook),
      async (context) => {
        const { id } = context.req.valid("param");
        const session = context.get("session") as SessionOrganization;
        const result = await chatService.getConversation(
          id,
          session.activeOrganizationId
        );

        switch (result) {
          case GetConversationErrors.inexistingConversation:
            return sendError(context, 404, result);
          case GetConversationErrors.notInMyOrg:
            return sendError(context, 403, result);
          case GetConversationErrors.noActiveOrganization:
            return sendError(context, 409, result);
        }

        return context.json(result);
      }
    )
    .post(
      "/:id/messages",
      requireAuth(),
      rateLimit({
        name: "chat-message",
        limit: CHAT_MESSAGE_RATE_LIMIT,
        windowSeconds: CHAT_RATE_LIMIT_WINDOW_SECONDS,
      }),
      zValidator("param", conversationParam, zodValidationHook),
      zValidator("json", RequestDto.SendMessageDto, zodValidationHook),
      (context) => {
        const { id } = context.req.valid("param");
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;

        return streamSSE(context, async (stream) => {
          for await (const event of chatService.streamMessage(
            id,
            dto,
            session.activeOrganizationId
          )) {
            await stream.writeSSE({
              event: event.type,
              data: JSON.stringify(event),
            });
          }
        });
      }
    )
    .post(
      "/:id/leads",
      requireAuth(),
      zValidator("param", conversationParam, zodValidationHook),
      zValidator("json", RequestDto.AttachLeadDto, zodValidationHook),
      async (context) => {
        const { id } = context.req.valid("param");
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await chatService.attachLead(
          id,
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case AttachLeadErrors.inexistingConversation:
          case AttachLeadErrors.inexistingLead:
            return sendError(context, 404, result);
          case AttachLeadErrors.notInMyOrg:
            return sendError(context, 403, result);
          case AttachLeadErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case AttachLeadErrors.attachFailed:
            return sendError(context, 500, result);
        }

        return context.json(result, 201);
      }
    )
    .delete(
      "/:id/leads/:leadId",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: DetachLeadErrors.invalidConversationId }),
          leadId: z.uuid({ message: DetachLeadErrors.invalidLeadId }),
        }),
        zodValidationHook
      ),
      async (context) => {
        const { id, leadId } = context.req.valid("param");
        const session = context.get("session") as SessionOrganization;
        const result = await chatService.detachLead(
          id,
          leadId,
          session.activeOrganizationId
        );

        switch (result) {
          case DetachLeadErrors.inexistingConversation:
            return sendError(context, 404, result);
          case DetachLeadErrors.notInMyOrg:
            return sendError(context, 403, result);
          case DetachLeadErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case DetachLeadErrors.detachFailed:
            return sendError(context, 500, result);
        }

        return context.body(null, 204);
      }
    )
    .delete(
      "/:id",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: DeleteConversationErrors.invalidConversationId }),
        }),
        zodValidationHook
      ),
      async (context) => {
        const { id } = context.req.valid("param");
        const session = context.get("session") as SessionOrganization;
        const result = await chatService.deleteConversation(
          id,
          session.activeOrganizationId
        );

        switch (result) {
          case DeleteConversationErrors.inexistingConversation:
            return sendError(context, 404, result);
          case DeleteConversationErrors.notInMyOrg:
            return sendError(context, 403, result);
          case DeleteConversationErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case DeleteConversationErrors.deleteFailed:
            return sendError(context, 500, result);
        }

        return context.body(null, 204);
      }
    );
}
