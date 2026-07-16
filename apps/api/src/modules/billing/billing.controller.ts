import { Hono } from "hono";
import { sendError } from "@shared/errors";
import {
  requireAuth,
  type AuthVariables,
} from "@shared/middleware/requireAuth.ts";
import type { BillingService } from "./billing.service.ts";
import { GetBillingStatusErrors } from "./billing.errors.ts";

type SessionOrganization = Readonly<{
  activeOrganizationId?: string | null;
}>;

export function createBillingRouter(billingService: BillingService) {
  return new Hono<{ Variables: AuthVariables }>().get(
    "/status",
    requireAuth(),
    async (context) => {
      const session = context.get("session") as SessionOrganization;
      const result = await billingService.getStatus(
        session.activeOrganizationId
      );

      switch (result) {
        case GetBillingStatusErrors.noActiveOrganization:
          return sendError(context, 409, result);
      }

      return context.json(result);
    }
  );
}
