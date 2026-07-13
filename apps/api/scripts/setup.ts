import { randomBytes } from "node:crypto";
import { createInterface, type Interface } from "node:readline/promises";
import { AGENT_DEFAULTS } from "../src/shared/llm/models.ts";

type EnvLine = Readonly<{ key: string; value: string }>;

const args = process.argv.slice(2);
const aioMode = args.includes("--aio");
const outFlagIndex = args.indexOf("--out");
const rawOut = outFlagIndex >= 0 ? args[outFlagIndex + 1] : undefined;
const outPath = rawOut ?? ".env";

const interactive = process.stdin.isTTY === true;
const rl: Interface | null = interactive
  ? createInterface({ input: process.stdin, output: process.stdout })
  : null;
const queued: Array<string> = interactive
  ? []
  : (await Bun.stdin.text()).split("\n");

const readLine = async (promptText: string): Promise<string> => {
  if (rl !== null) return rl.question(promptText);
  const next = queued.shift() ?? "";
  process.stdout.write(`${promptText}${next}\n`);
  return next;
};

const ask = async (question: string, fallback: string): Promise<string> => {
  const suffix = fallback === "" ? "" : ` [${fallback}]`;
  const answer = (await readLine(`${question}${suffix}: `)).trim();
  return answer === "" ? fallback : answer;
};

const askYesNo = async (
  question: string,
  fallback: boolean
): Promise<boolean> => {
  const hint = fallback ? "Y/n" : "y/N";
  const answer = (await readLine(`${question} [${hint}]: `)).trim().toLowerCase();
  if (answer === "") return fallback;
  return answer === "y" || answer === "yes";
};

const generate = (encoding: "hex" | "base64"): string =>
  randomBytes(32).toString(encoding);

const run = async (): Promise<void> => {
  if (await Bun.file(outPath).exists()) {
    const overwrite = await askYesNo(`${outPath} already exists. Overwrite?`, false);
    if (!overwrite) {
      console.log("Aborted, nothing written.");
      return;
    }
  }

  console.log("\n  Tanchi setup — press Enter to accept each [default].\n");
  const lines: Array<EnvLine> = [];
  const put = (key: string, value: string): void => {
    lines.push({ key, value });
  };

  if (!aioMode) {
    put("NODE_ENV", "development");
    put(
      "DATABASE_URL",
      await ask(
        "PostgreSQL URL",
        "postgres://postgres:postgres@localhost:5432/tanchi"
      )
    );
    put("REDIS_URL", await ask("Redis URL", "redis://localhost:6379"));
    put("APP_URL", await ask("Web origin (APP_URL)", "http://localhost:5173"));
    put(
      "AUTH_BASE_URL",
      await ask("API URL (AUTH_BASE_URL)", "http://localhost:3000")
    );
    put(
      "VITE_API_URL",
      await ask("API base baked into the web build", "http://localhost:3000")
    );
    put("AUTH_SECRET", generate("hex"));
    put("ENCRYPTION_KEY", generate("base64"));
    console.log("  -> generated AUTH_SECRET and ENCRYPTION_KEY.");
  }

  put("LLM_PROVIDER", await ask("LLM provider (api or cli)", "api"));
  put(
    "ANTHROPIC_API_KEY",
    await ask("Anthropic API key (required for the engine)", "")
  );

  if (await askYesNo("Customize per-agent models?", false)) {
    for (const [agent, model] of Object.entries(AGENT_DEFAULTS)) {
      const chosen = await ask(`  model for ${agent}`, model);
      if (chosen !== model) put(`LLM_MODEL_${agent.toUpperCase()}`, chosen);
    }
  }

  put("HUNTER_API_KEY", await ask("Hunter.io API key (optional)", ""));
  put(
    "REQUIRE_EMAIL_VERIFICATION",
    (await askYesNo("Require email verification?", false)) ? "true" : "false"
  );
  if (!aioMode) put("RUN_WORKERS", "true");

  const configureMailer = await askYesNo("Configure an SMTP mailer now?", false);
  put("MAIL_FROM_EMAIL", await ask("From address", "Tanchi <no-reply@tanchi.io>"));
  if (configureMailer) {
    put("MAIL_SMTP_HOST", await ask("  SMTP host", ""));
    put("MAIL_SMTP_PORT", await ask("  SMTP port", "587"));
    put("MAIL_SMTP_USER", await ask("  SMTP user", ""));
    put("MAIL_SMTP_PASS", await ask("  SMTP password", ""));
    put(
      "MAIL_SMTP_SECURE",
      (await askYesNo("  SMTP secure (TLS)?", false)) ? "true" : "false"
    );
  }

  const body = `${lines.map(({ key, value }) => `${key}=${value}`).join("\n")}\n`;
  await Bun.write(outPath, body);
  console.log(`\n  Wrote ${outPath}\n`);

  const anthropic = lines.find((line) => line.key === "ANTHROPIC_API_KEY");
  if (anthropic !== undefined && anthropic.value === "") {
    console.log(
      "  Warning: ANTHROPIC_API_KEY is empty — the engine and chat stay disabled until you set it.\n"
    );
  }
};

await run();
rl?.close();
