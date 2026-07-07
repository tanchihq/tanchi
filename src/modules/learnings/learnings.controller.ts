import { Hono } from "hono";
import { sendError } from "@shared/errors";
import { requireAuth, type AuthVariables } from "@shared/middleware/requireAuth.ts";
import type { LearningsService } from "./learnings.service.ts";
import { GetLearningsErrors } from "./learnings.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createLearningsRouter(learningsService: LearningsService) {
  return new Hono<{ Variables: AuthVariables }>().get(
    "/",
    requireAuth(),
    async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await learningsService.getLearnings(
        session.activeOrganizationId
      );

      switch (result) {
        case GetLearningsErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    }
  );
}
