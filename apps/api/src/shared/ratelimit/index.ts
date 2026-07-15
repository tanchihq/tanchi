import { Redis } from "ioredis";
import type { Context, MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/bun";
import { AppError } from "@shared/errors";
import type { AuthVariables } from "@shared/middleware/requireAuth.ts";
import { ARRAY } from "@shared/utils";
import { env } from "../../env.ts";

const HTTP_TOO_MANY_REQUESTS = 429;

type RateLimitOptions = Readonly<{
  name: string;
  limit: number;
  windowSeconds: number;
  keyBy?: "user" | "ip";
}>;

const client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

client.on("error", (error) => {
  console.error("[ratelimit] redis connection error", error);
});

function clientIp(context: Context): string {
  const forwarded = context.req.header("x-forwarded-for");
  if (forwarded !== undefined) {
    return forwarded.split(",")[ARRAY.FIRST_INDEX]?.trim() ?? "unknown";
  }
  try {
    return getConnInfo(context).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
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
      console.error("[ratelimit] check failed, allowing request", error);
    }
    await next();
  };
}

export async function closeRateLimit(): Promise<void> {
  await client.quit();
}
