import type { MiddlewareHandler } from "hono";
import { AppError } from "@shared/errors";
import type { AuthVariables } from "./requireAuth.ts";

const HTTP_BAD_REQUEST = 400;

type ActiveOrgVariables = AuthVariables &
  Readonly<{
    activeOrganizationId: string;
  }>;

export function requireActiveOrganization(): MiddlewareHandler<{
  Variables: ActiveOrgVariables;
}> {
  return async (c, next) => {
    const session = c.get("session") as Readonly<{
      activeOrganizationId?: string | null;
    }>;
    const orgId = session.activeOrganizationId;
    if (orgId === undefined || orgId === null || orgId === "") {
      throw new AppError(HTTP_BAD_REQUEST, "noActiveOrganization");
    }
    c.set("activeOrganizationId", orgId);
    await next();
  };
}

export type { ActiveOrgVariables };
