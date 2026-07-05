import { z } from "zod";

const AUTH_SECRET_MIN_LENGTH = 32;
const ENCRYPTION_KEY_MIN_LENGTH = 44;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  APP_URL: z.url().default("http://localhost:5173"),
  AUTH_SECRET: z.string().min(AUTH_SECRET_MIN_LENGTH),
  AUTH_BASE_URL: z.url().default("http://localhost:3000"),
  ENCRYPTION_KEY: z.string().min(ENCRYPTION_KEY_MIN_LENGTH),

  LLM_PROVIDER: z.enum(["cli", "api"]).default("cli"),
  CLAUDE_CLI_BIN: z.string().min(1).default("claude"),
  CLAUDE_CLI_TIMEOUT_MS: z.coerce.number().int().positive().default(600_000),
  ANTHROPIC_API_KEY: z.string().optional(),

  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  HUNTER_API_KEY: z.string().optional(),

  RUN_WORKERS: z.enum(["true", "false"]).default("true"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const isDevelopment = env.NODE_ENV === "development";
