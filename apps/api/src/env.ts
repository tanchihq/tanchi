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

  BILLING_ENABLED: z.enum(["true", "false"]).default("false"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SOLO_PRICE_ID: z.string().optional(),

  REQUIRE_EMAIL_VERIFICATION: z.enum(["true", "false"]).default("true"),
  DISABLE_SIGNUP: z.enum(["true", "false"]).default("false"),
  MAIL_FROM_EMAIL: z
    .string()
    .min(1)
    .default("Tanchi <no-reply@tanchi.io>"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  MAIL_SMTP_HOST: z.string().optional(),
  MAIL_SMTP_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SMTP_USER: z.string().optional(),
  MAIL_SMTP_PASS: z.string().optional(),
  MAIL_SMTP_SECURE: z.enum(["true", "false"]).default("false"),
});

export type Env = z.infer<typeof envSchema>;

export const ENV_KEYS: ReadonlyArray<string> = Object.keys(envSchema.shape);

export const env: Env = envSchema.parse(process.env);

export const isDevelopment = env.NODE_ENV === "development";
export const isBillingEnabled = env.BILLING_ENABLED === "true";

const MISSING_STRIPE_VARS = [
  ["STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY],
  ["STRIPE_WEBHOOK_SECRET", env.STRIPE_WEBHOOK_SECRET],
  ["STRIPE_SOLO_PRICE_ID", env.STRIPE_SOLO_PRICE_ID],
] as const;

if (isBillingEnabled) {
  const missing = MISSING_STRIPE_VARS.filter(
    ([, value]) => value === undefined || value === ""
  ).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(
      `BILLING_ENABLED=true requires ${missing.join(", ")} to be set`
    );
  }
}
