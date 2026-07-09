import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { ProspectsService } from "./prospects.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  ContactProspectErrors,
  DeleteProspectErrors,
  GetProspectErrors,
  GetProspectsErrors,
  UpdateStageErrors,
  ValidateProspectErrors,
} from "./prospects.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createProspectsRouter(prospectsService: ProspectsService) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await prospectsService.getProspects(
        session.activeOrganizationId
      );

      switch (result) {
        case GetProspectsErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    })
    .get(
      "/:id",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: GetProspectErrors.invalidProspectId }),
        }),
        zodValidationHook
      ),
      async (context) => {
        const { id } = context.req.valid("param");
        const session = context.get("session") as SessionOrganization;
        const result = await prospectsService.getProspect(
          id,
          session.activeOrganizationId
        );

        switch (result) {
          case GetProspectErrors.inexistingProspect:
            return sendError(context, 404, result);
          case GetProspectErrors.notInMyOrg:
            return sendError(context, 403, result);
          case GetProspectErrors.noActiveOrganization:
            return sendError(context, 409, result);
        }

        return context.json(result);
      }
    )
    .patch(
      "/:id/stage",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: UpdateStageErrors.invalidProspectId }),
        }),
        zodValidationHook
      ),
      zValidator("json", RequestDto.UpdateStageDto, zodValidationHook),
      async (context) => {
        const { id } = context.req.valid("param");
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await prospectsService.updateStage(
          id,
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case UpdateStageErrors.inexistingProspect:
            return sendError(context, 404, result);
          case UpdateStageErrors.notInMyOrg:
            return sendError(context, 403, result);
          case UpdateStageErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case UpdateStageErrors.updateFailed:
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
          id: z.uuid({ message: DeleteProspectErrors.invalidProspectId }),
        }),
        zodValidationHook
      ),
      zValidator("json", RequestDto.DeleteProspectDto, zodValidationHook),
      async (context) => {
        const { id } = context.req.valid("param");
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await prospectsService.deleteProspect(
          id,
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case DeleteProspectErrors.inexistingProspect:
            return sendError(context, 404, result);
          case DeleteProspectErrors.notInMyOrg:
            return sendError(context, 403, result);
          case DeleteProspectErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case DeleteProspectErrors.deleteFailed:
            return sendError(context, 500, result);
        }

        return context.body(null, 204);
      }
    )
    .post(
      "/:id/contact",
      requireAuth(),
      zValidator(
        "param",
        z.object({
          id: z.uuid({ message: ContactProspectErrors.invalidProspectId }),
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
        const result = await prospectsService.contactProspect(
          id,
          session.activeOrganizationId,
          senderId
        );

        switch (result) {
          case ContactProspectErrors.inexistingProspect:
            return sendError(context, 404, result);
          case ContactProspectErrors.notInMyOrg:
            return sendError(context, 403, result);
          case ContactProspectErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case ContactProspectErrors.noDraft:
          case ContactProspectErrors.noSender:
            return sendError(context, 422, result);
          case ContactProspectErrors.sendFailed:
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
          id: z.uuid({ message: ValidateProspectErrors.invalidProspectId }),
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
        const result = await prospectsService.validateProspect(
          id,
          session.activeOrganizationId,
          senderId
        );

        switch (result) {
          case ValidateProspectErrors.inexistingProspect:
            return sendError(context, 404, result);
          case ValidateProspectErrors.notInMyOrg:
            return sendError(context, 403, result);
          case ValidateProspectErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case ValidateProspectErrors.noDraft:
          case ValidateProspectErrors.noSender:
            return sendError(context, 422, result);
          case ValidateProspectErrors.sendFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    );
}
