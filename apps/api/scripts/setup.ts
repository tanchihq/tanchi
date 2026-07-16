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

  section("Claude");
  const provider = await ask("Provider — api or cli", "api");
  put("LLM_PROVIDER", provider);
  if (provider === "api") {
    put("ANTHROPIC_API_KEY", await ask("Anthropic API key", ""));
  } else if (aioMode) {
    console.log(
      "  cli mode: after startup, run `docker exec -it tanchi claude` once to authenticate."
    );
  } else {
    console.log(
      "  cli mode uses the local `claude` binary; authenticate it before use."
    );
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

  if (provider === "api") {
    const anthropic = lines.find((line) => line.key === "ANTHROPIC_API_KEY");
    if (anthropic !== undefined && anthropic.value === "") {
      console.log(
        "  Warning: no Anthropic API key — the engine and chat stay disabled until you set one.\n"
      );
    }
  }
};

await run();
rl?.close();
