import { Redis } from "ioredis";
import type { Context, MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/bun";
import { AppError } from "@shared/errors";
import type { AuthVariables } from "@shared/middleware/requireAuth.ts";
import { ARRAY } from "@shared/utils";
import { env } from "../../env.ts";

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVICE_UNAVAILABLE = 503;

type RateLimitOptions = Readonly<{
  name: string;
  limit: number;
  windowSeconds: number;
  keyBy?: "user" | "ip";
  failClosed?: boolean;
}>;

const client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

client.on("error", (error) => {
  console.error("[ratelimit] redis connection error", error);
});

function connectionIp(context: Context): string {
  try {
    return getConnInfo(context).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

function clientIp(context: Context): string {
  if (env.TRUSTED_PROXY_COUNT <= 0) return connectionIp(context);
  const forwarded = context.req.header("x-forwarded-for");
  if (forwarded === undefined) return connectionIp(context);
  const parts = forwarded
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return connectionIp(context);
  const index = Math.max(parts.length - env.TRUSTED_PROXY_COUNT, ARRAY.FIRST_INDEX);
  return parts[index] ?? connectionIp(context);
}

function userIdentity(context: Context<{ Variables: AuthVariables }>): string {
  const user = context.get("user");
  return user === undefined ? "anonymous" : user.id;
}

export function rateLimit(
  options: RateLimitOptions
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (context, next) => {
    const identity =
      options.keyBy === "ip" ? clientIp(context) : userIdentity(context);
    const key = `ratelimit:${options.name}:${identity}`;
    try {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, options.windowSeconds);
      }
      if (count > options.limit) {
        throw new AppError(HTTP_TOO_MANY_REQUESTS, "rateLimited");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (options.failClosed === true) {
        console.error("[ratelimit] check failed, rejecting request", error);
        throw new AppError(HTTP_SERVICE_UNAVAILABLE, "rateLimited");
      }
      console.error("[ratelimit] check failed, allowing request", error);
    }
    await next();
  };
}

export async function closeRateLimit(): Promise<void> {
  await client.quit();
}
