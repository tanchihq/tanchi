import { mock } from "bun:test";
import { applyMigrations, ensureTestDatabase } from "./migrate.ts";

const ENCRYPTION_KEY_BYTES = 32;

process.env.NODE_ENV = "test";
const configuredDatabaseUrl = new URL(
  process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/tanchi_test"
);
if (!configuredDatabaseUrl.pathname.slice(1).includes("test")) {
  configuredDatabaseUrl.pathname = "/tanchi_test";
}
process.env.DATABASE_URL = configuredDatabaseUrl.toString();
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.AUTH_SECRET = "test-auth-secret-that-is-at-least-32-characters";
process.env.ENCRYPTION_KEY = Buffer.alloc(ENCRYPTION_KEY_BYTES).toString(
  "base64"
);
process.env.LLM_PROVIDER = "api";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.RUN_WORKERS = "false";
process.env.BILLING_ENABLED = "false";
process.env.REQUIRE_EMAIL_VERIFICATION = "false";
process.env.APP_URL = "http://localhost";
process.env.AUTH_BASE_URL = "http://localhost";

mock.module("@shared/llm", () => ({
  llm: {
    generate: () => Promise.resolve("mock-generated-text"),
    research: () => Promise.resolve("mock-research-text"),
    stream: async function* () {
      yield "mock-stream-chunk";
    },
    agent: async function* () {
      yield { type: "text", text: "mock-agent-text" };
    },
  },
  agentModel: () => "mock-model",
  DEFAULT_MODEL: "mock-model",
}));

mock.module("@shared/company-profile", () => ({
  generateCompanyProfile: () => Promise.resolve("Mock company profile."),
}));

mock.module("@shared/mailer", () => ({
  sendSystemEmail: () => Promise.resolve(undefined),
}));

mock.module("@shared/mailbox", () => ({
  verifyMailbox: () => Promise.resolve({ ok: true }),
  sendEmail: () => Promise.resolve({ messageId: "mock-message-id" }),
  fetchRecentReplies: () => Promise.resolve([]),
}));

mock.module("@shared/web", () => ({
  fetchPageText: () => Promise.resolve("mock page text"),
  htmlToText: (html: string) => html,
  normalizeForMatch: (value: string) => value.trim().toLowerCase(),
  verifyQuote: () => true,
  hostOf: (url: string) => {
    try {
      return new URL(url).host.replace(/^www\./, "").toLowerCase();
    } catch {
      return null;
    }
  },
}));

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error("[test] DATABASE_URL is required");
}
await ensureTestDatabase(databaseUrl);
await applyMigrations(databaseUrl);
