import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { SuppressionService } from "./suppression.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  GetSuppressionErrors,
  ImportSuppressionErrors,
} from "./suppression.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createSuppressionRouter(
  suppressionService: SuppressionService
) {
  return new Hono<{ Variables: AuthVariables }>()
    .post(
      "/import",
      requireAuth(),
      zValidator("form", RequestDto.ImportSuppressionDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("form");
        const session = context.get("session") as SessionOrganization;
        const result = await suppressionService.importCsv(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case ImportSuppressionErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case ImportSuppressionErrors.invalidFile:
          case ImportSuppressionErrors.noEmailsFound:
            return sendError(context, 422, result);
          case ImportSuppressionErrors.importFailed:
            return sendError(context, 500, result);
        }

        return context.json(result, 201);
      }
    )
    .get("/", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await suppressionService.getList(
        session.activeOrganizationId
      );

      switch (result) {
        case GetSuppressionErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    });
}
