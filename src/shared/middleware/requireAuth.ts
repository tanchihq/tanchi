import type { MiddlewareHandler } from "hono";
import { AppError } from "@shared/errors";
import { auth, type Session, type User } from "@shared/auth";

const HTTP_UNAUTHORIZED = 401;

export interface AuthVariables {
  readonly session: Session;
  readonly user: User;
}

export function requireAuth(): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const data = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!data) {
      throw new AppError(HTTP_UNAUTHORIZED, "Authentication required");
    }
    c.set("session", data.session);
    c.set("user", data.user);
    await next();
  };
}
