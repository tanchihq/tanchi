import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import type { SettingsService } from "./settings.service.ts";
import * as RequestDto from "./dto/request/index.ts";
import {
  GenerateCompanyProfileErrors,
  GetSettingsErrors,
  UpdateSettingsErrors,
} from "./settings.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createSettingsRouter(settingsService: SettingsService) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await settingsService.getSettings(
        session.activeOrganizationId
      );

      switch (result) {
        case GetSettingsErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    })
    .put(
      "/",
      requireAuth(),
      zValidator("json", RequestDto.UpdateSettingsDto, zodValidationHook),
      async (context) => {
        const dto = context.req.valid("json");
        const session = context.get("session") as SessionOrganization;
        const result = await settingsService.updateSettings(
          dto,
          session.activeOrganizationId
        );

        switch (result) {
          case UpdateSettingsErrors.invalidCompanyName:
          case UpdateSettingsErrors.invalidWebsite:
          case UpdateSettingsErrors.invalidResource:
          case UpdateSettingsErrors.invalidLanguage:
          case UpdateSettingsErrors.invalidCompanyProfile:
          case UpdateSettingsErrors.invalidIcp:
          case UpdateSettingsErrors.tooManyIcps:
            return sendError(context, 400, result);
          case UpdateSettingsErrors.noActiveOrganization:
            return sendError(context, 409, result);
          case UpdateSettingsErrors.updateFailed:
            return sendError(context, 500, result);
        }

        return context.json(result);
      }
    )
    .post("/generate-profile", requireAuth(), async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await settingsService.generateProfile(
        session.activeOrganizationId
      );

      switch (result) {
        case GenerateCompanyProfileErrors.noActiveOrganization:
          return sendError(context, 409, result);
        case GenerateCompanyProfileErrors.generationFailed:
          return sendError(context, 500, result);
      }

      return context.json(result);
    });
}
