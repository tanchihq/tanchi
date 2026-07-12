import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { SendersService } from "./senders.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  CreateSenderErrors,
  DeleteSenderErrors,
  ListSendersErrors,
  TestSenderErrors,
  UpdateSenderErrors,
} from "./senders.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createSendersRouter(sendersService: SendersService) {
  return new Hono<{ Variables: AuthVariables }>()
    .post(
      "/",
      requireAuth(),
      zValidator("json", RequestDto.CreateSenderDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await sendersService.createSender(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case CreateSenderErrors.invalidFromName:
          case CreateSenderErrors.invalidFromEmail:
          case CreateSenderErrors.invalidHost:
          case CreateSenderErrors.invalidPort:
          case CreateSenderErrors.invalidUsername:
          case CreateSenderErrors.invalidSecret:
          case CreateSenderErrors.invalidDailyCap:
          case CreateSenderErrors.invalidSignature:
            return sendError(context, 400, result);
          case CreateSenderErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case CreateSenderErrors.createFailed:
            return sendError(context, 500, result);
        }

        return context.json(result, 201);
      }
    )
    .get("/", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await sendersService.listSenders(
        session.activeOrganizationId
      );

      switch (result) {
        case ListSendersErrors.noActiveOrganization:
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
          id: z.uuid({ message: UpdateSenderErrors.invalidSenderId }),
        }),
        zodValidationHook
      ),
      zValidator("json", RequestDto.UpdateSenderDto, zodValidationHook),
      async (context) => {
        const { id } = context.req.valid("param");
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await sendersService.updateSender(
          id,
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case UpdateSenderErrors.invalidFromName:
          case UpdateSenderErrors.invalidFromEmail:
          case UpdateSenderErrors.invalidHost:
          case UpdateSenderErrors.invalidPort:
          case UpdateSenderErrors.invalidUsername:
          case UpdateSenderErrors.invalidSecret:
          case UpdateSenderErrors.invalidDailyCap:
          case UpdateSenderErrors.invalidSignature:
            return sendError(context, 400, result);
          case UpdateSenderErrors.inexistingSender:
            return sendError(context, 404, result);
          case UpdateSenderErrors.notInMyOrg:
            return sendError(context, 403, result);
          case UpdateSenderErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case UpdateSenderErrors.updateFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    )
    .delete(
      "/:id",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: DeleteSenderErrors.invalidSenderId }),
        }),
        zodValidationHook
      ),
      async (context) => {
        const { id } = context.req.valid("param");
        const session = context.get("session") as SessionOrganization;
        const result = await sendersService.deleteSender(
          id,
          session.activeOrganizationId
        );

        switch (result) {
          case DeleteSenderErrors.inexistingSender:
            return sendError(context, 404, result);
          case DeleteSenderErrors.notInMyOrg:
            return sendError(context, 403, result);
          case DeleteSenderErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case DeleteSenderErrors.deleteFailed:
            return sendError(context, 500, result);
        }

        return context.body(null, 204);
      }
    )
    .post(
      "/:id/test",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: TestSenderErrors.invalidSenderId }),
        }),
        zodValidationHook
      ),
      async (context) => {
        const { id } = context.req.valid("param");
        const session = context.get("session") as SessionOrganization;
        const result = await sendersService.testSender(
          id,
          session.activeOrganizationId
        );

        switch (result) {
          case TestSenderErrors.inexistingSender:
            return sendError(context, 404, result);
          case TestSenderErrors.notInMyOrg:
            return sendError(context, 403, result);
          case TestSenderErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case TestSenderErrors.connectionFailed:
            return sendError(context, 422, result);
        }

        return context.json(result);
      }
    );
}
