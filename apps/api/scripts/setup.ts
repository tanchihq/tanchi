import { randomBytes } from "node:crypto";
import { createInterface, type Interface } from "node:readline/promises";

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
  const answer = (await readLine(`  ${question}${suffix}: `)).trim();
  return answer === "" ? fallback : answer;
};

const askYesNo = async (
  question: string,
  fallback: boolean
): Promise<boolean> => {
  const hint = fallback ? "Y/n" : "y/N";
  const answer = (await readLine(`  ${question} [${hint}]: `))
    .trim()
    .toLowerCase();
  if (answer === "") return fallback;
  return answer === "y" || answer === "yes";
};

const section = (title: string): void => {
  console.log(`\n  ${title}\n  ${"-".repeat(title.length)}`);
};

const generate = (encoding: "hex" | "base64"): string =>
  randomBytes(32).toString(encoding);

const run = async (): Promise<void> => {
  if (await Bun.file(outPath).exists()) {
    const overwrite = await askYesNo(
      `${outPath} already exists. Overwrite?`,
      false
    );
    if (!overwrite) {
      console.log("  Aborted, nothing written.");
      return;
    }
  }

  console.log(`
  Tanchi — setup
  ==============
  Everything except the questions below is configured automatically.`);

  const lines: Array<EnvLine> = [];
  const put = (key: string, value: string): void => {
    lines.push({ key, value });
  };

  if (!aioMode) {
    put("NODE_ENV", "development");
    put("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/tanchi");
    put("REDIS_URL", "redis://localhost:6379");
    put("APP_URL", "http://localhost:5173");
    put("AUTH_BASE_URL", "http://localhost:3000");
    put("VITE_API_URL", "http://localhost:3000");
    put("AUTH_SECRET", generate("hex"));
    put("ENCRYPTION_KEY", generate("base64"));
    put("RUN_WORKERS", "true");
    put("REQUIRE_EMAIL_VERIFICATION", "false");
  }

  section("AI provider");
  console.log(
    "  api = Claude via the Anthropic API, cli = the local claude binary."
  );
  const provider = await ask(
    "Provider — api, openai, gemini, kimi or cli",
    "api"
  );
  put("LLM_PROVIDER", provider);

  const keyForProvider: Readonly<Record<string, readonly [string, string]>> = {
    api: ["ANTHROPIC_API_KEY", "Anthropic API key"],
    anthropic: ["ANTHROPIC_API_KEY", "Anthropic API key"],
    openai: ["OPENAI_API_KEY", "OpenAI API key"],
    gemini: ["GEMINI_API_KEY", "Google Gemini API key"],
    kimi: ["MOONSHOT_API_KEY", "Moonshot (Kimi) API key"],
  };

  const providerKey = keyForProvider[provider];
  if (providerKey !== undefined) {
    put(providerKey[0], await ask(providerKey[1], ""));
  } else if (aioMode) {
    console.log(
      "  cli mode: after startup, run `docker exec -it tanchi claude` once to authenticate."
    );
  } else {
    console.log(
      "  cli mode uses the local `claude` binary; authenticate it before use."
    );
  }

  if (provider === "kimi") {
    console.log(
      "  Moonshot documents its web search as being reworked, so prospect research"
    );
    console.log(
      "  is weaker on Kimi. You can delegate research to another provider."
    );
    if (await askYesNo("Delegate web research to another provider?", true)) {
      const researchProvider = await ask(
        "Research provider — anthropic, openai or gemini",
        "gemini"
      );
      put("LLM_RESEARCH_PROVIDER", researchProvider);
      const researchKey = keyForProvider[researchProvider];
      if (researchKey !== undefined) {
        put(researchKey[0], await ask(researchKey[1], ""));
      }
    }
  }

  section("Sourcing");
  const hunter = await ask("Hunter.io API key (optional, Enter to skip)", "");
  if (hunter !== "") put("HUNTER_API_KEY", hunter);

  section("Email");
  if (await askYesNo("Set up an SMTP server now? (optional)", false)) {
    put("MAIL_SMTP_HOST", await ask("SMTP host", ""));
    put("MAIL_SMTP_PORT", await ask("SMTP port", "587"));
    put("MAIL_SMTP_USER", await ask("SMTP user", ""));
    put("MAIL_SMTP_PASS", await ask("SMTP password", ""));
    put(
      "MAIL_SMTP_SECURE",
      (await askYesNo("Use TLS?", false)) ? "true" : "false"
    );
    put(
      "MAIL_FROM_EMAIL",
      await ask("From address", "Tanchi <no-reply@tanchi.io>")
    );
  }

  const body = `${lines.map(({ key, value }) => `${key}=${value}`).join("\n")}\n`;
  await Bun.write(outPath, body);
  console.log(`\n  Saved to ${outPath}. Starting Tanchi...\n`);

  const expectedKey = keyForProvider[provider];
  if (expectedKey !== undefined) {
    const stored = lines.find((line) => line.key === expectedKey[0]);
    if (stored === undefined || stored.value === "") {
      console.log(
        `  Warning: no ${expectedKey[0]} — the engine and chat stay disabled until you set one.\n`
      );
    }
  }
};

await run();
rl?.close();
