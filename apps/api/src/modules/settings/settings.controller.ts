import { Hono } from "hono";
import { isBillingEnabled } from "../../env.ts";
import { zValidator } from "@hono/zod-validator";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import { rateLimit } from "@shared/ratelimit";
import {
  activeProviderLabel,
  agentModel,
  isResearchAvailable,
  researchProviderLabel,
  researchUnavailableReason,
  type AgentKey,
} from "@shared/llm";
import { zodValidationHook } from "@shared/middleware/zodValidationHook.ts";
import {
  GENERATE_PROFILE_RATE_LIMIT,
  GENERATE_PROFILE_RATE_LIMIT_WINDOW_SECONDS,
} from "./settings.constants.ts";
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

const EXPOSED_AGENTS: ReadonlyArray<AgentKey> = [
  "chasseur",
  "profiler",
  "copywriter",
  "analyste",
  "chat",
];

export function createSettingsRouter(settingsService: SettingsService) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/intelligence", requireAuth(), (context) =>
      context.json({
        isManaged: isBillingEnabled,
        generationProvider: activeProviderLabel,
        researchProvider: researchProviderLabel,
        isResearchAvailable,
        researchUnavailableReason,
        models: isBillingEnabled
          ? []
          : EXPOSED_AGENTS.map((agent) => ({
              agent,
              model: agentModel(agent),
            })),
      })
    )
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
          case UpdateSettingsErrors.invalidFollowUp:
          case UpdateSettingsErrors.invalidLeadsPerDay:
          case UpdateSettingsErrors.invalidMarket:
          case UpdateSettingsErrors.tooManyMarkets:
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
    .post(
      "/generate-profile",
      requireAuth(),
      rateLimit({
        name: "settings-generate-profile",
        limit: GENERATE_PROFILE_RATE_LIMIT,
        windowSeconds: GENERATE_PROFILE_RATE_LIMIT_WINDOW_SECONDS,
      }),
      zValidator(
        "json",
        RequestDto.GenerateCompanyProfileDto,
        zodValidationHook
      ),
      async (context) => {
      const dto = context.req.valid("json");
      const session = context.get("session") as SessionOrganization;
      const result = await settingsService.generateProfile(
        dto,
        session.activeOrganizationId
      );

      switch (result) {
        case GenerateCompanyProfileErrors.invalidMarket:
          return sendError(context, 400, result);
        case GenerateCompanyProfileErrors.noActiveOrganization:
          return sendError(context, 409, result);
        case GenerateCompanyProfileErrors.generationFailed:
          return sendError(context, 500, result);
      }

      return context.json(result);
    });
}
