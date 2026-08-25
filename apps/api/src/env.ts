import { z } from "zod";

const AUTH_SECRET_MIN_LENGTH = 32;
const ENCRYPTION_KEY_MIN_LENGTH = 44;
const PLACEHOLDER_SECRET = /change-me/i;
const notPlaceholder = (value: string): boolean =>
  !PLACEHOLDER_SECRET.test(value);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  APP_URL: z.url().default("http://localhost:5173"),
  AUTH_SECRET: z
    .string()
    .min(AUTH_SECRET_MIN_LENGTH)
    .refine(notPlaceholder, {
      message: "AUTH_SECRET must not be a placeholder value",
    }),
  AUTH_BASE_URL: z.url().default("http://localhost:3000"),
  ENCRYPTION_KEY: z
    .string()
    .min(ENCRYPTION_KEY_MIN_LENGTH)
    .refine(notPlaceholder, {
      message: "ENCRYPTION_KEY must not be a placeholder value",
    }),

  LLM_PROVIDER: z
    .enum(["cli", "api", "anthropic", "openai", "gemini", "kimi"])
    .default("cli"),
  LLM_RESEARCH_PROVIDER: z
    .enum(["cli", "api", "anthropic", "openai", "gemini", "kimi"])
    .optional(),
  CLAUDE_CLI_BIN: z.string().min(1).default("claude"),
  CLAUDE_CLI_TIMEOUT_MS: z.coerce.number().int().positive().default(600_000),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.url().default("https://api.openai.com/v1"),
  GEMINI_API_KEY: z.string().optional(),
  MOONSHOT_API_KEY: z.string().optional(),
  MOONSHOT_BASE_URL: z.url().default("https://api.moonshot.ai/v1"),

  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).default(0),
  HUNTER_API_KEY: z.string().optional(),

  RUN_WORKERS: z.enum(["true", "false"]).default("true"),

  BILLING_ENABLED: z.enum(["true", "false"]).default("false"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SOLO_PRICE_ID: z.string().optional(),

  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.url().default("https://eu.i.posthog.com"),

  REQUIRE_EMAIL_VERIFICATION: z.enum(["true", "false"]).default("false"),
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
export const isMailerConfigured =
  env.MAIL_SMTP_HOST !== undefined || env.RESEND_API_KEY !== undefined;
export const isEmailVerificationRequired =
  env.REQUIRE_EMAIL_VERIFICATION === "true";

if (isEmailVerificationRequired && !isMailerConfigured) {
  throw new Error(
    "REQUIRE_EMAIL_VERIFICATION=true needs a mailer to send the verification link: set MAIL_SMTP_HOST or RESEND_API_KEY, or set REQUIRE_EMAIL_VERIFICATION=false"
  );
}

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
