import { Redis } from "ioredis";
import type { MiddlewareHandler } from "hono";
import { AppError } from "@shared/errors";
import type { AuthVariables } from "@shared/middleware/requireAuth.ts";
import { env } from "../../env.ts";

const HTTP_TOO_MANY_REQUESTS = 429;

type RateLimitOptions = Readonly<{
  name: string;
  limit: number;
  windowSeconds: number;
}>;

const client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

client.on("error", (error) => {
  console.error("[ratelimit] redis connection error", error);
});

export function rateLimit(
  options: RateLimitOptions
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (context, next) => {
    const user = context.get("user");
    const identity = user === undefined ? "anonymous" : user.id;
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
