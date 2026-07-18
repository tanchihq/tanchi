import type { MiddlewareHandler } from "hono";
import { AppError } from "@shared/errors";
import { auth, type Session, type User } from "@shared/auth";
import { isEmailVerificationRequired } from "../../env.ts";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

export interface AuthVariables {
  readonly session: Session;
  readonly user: User;
}

type RequireAuthOptions = Readonly<{
  requireVerifiedEmail?: boolean;
}>;

export function requireAuth(
  options: RequireAuthOptions = {}
): MiddlewareHandler<{ Variables: AuthVariables }> {
  const requireVerifiedEmail =
    options.requireVerifiedEmail ?? isEmailVerificationRequired;
  return async (c, next) => {
    const data = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!data) {
      throw new AppError(HTTP_UNAUTHORIZED, "Authentication required");
    }
    if (requireVerifiedEmail && data.user.emailVerified !== true) {
      throw new AppError(HTTP_FORBIDDEN, "emailNotVerified");
    }
    c.set("session", data.session);
    c.set("user", data.user);
    await next();
  };
}
