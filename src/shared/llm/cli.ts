import type {
  LlmGenerateInput,
  LlmProvider,
  LlmResearchInput,
} from "./types.ts";

const RESEARCH_TOOLS = "WebSearch WebFetch";

export class ClaudeCliProvider implements LlmProvider {
  constructor(
    private readonly bin: string,
    private readonly defaultTimeoutMs: number
  ) {}

  research(input: LlmResearchInput): Promise<string> {
    return this.run(
      input.prompt,
      ["-p", "--output-format", "text", "--allowedTools", RESEARCH_TOOLS],
      input.timeoutMs ?? this.defaultTimeoutMs
    );
  }

  generate(input: LlmGenerateInput): Promise<string> {
    const prompt =
      input.system === undefined
        ? input.prompt
        : `${input.system}\n\n${input.prompt}`;
    return this.run(
      prompt,
      ["-p", "--output-format", "text"],
      this.defaultTimeoutMs
    );
  }

  async *stream(input: LlmGenerateInput): AsyncIterable<string> {
    yield await this.generate(input);
  }

  private async run(
    prompt: string,
    args: ReadonlyArray<string>,
    timeoutMs: number
  ): Promise<string> {
    const process = Bun.spawn([this.bin, ...args], {
      stdin: new TextEncoder().encode(prompt),
      stdout: "pipe",
      stderr: "pipe",
    });

    const timeout = setTimeout(() => {
      process.kill();
    }, timeoutMs);

    try {
      const stdout = await new Response(process.stdout).text();
      const exitCode = await process.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(process.stderr).text();
        throw new Error(
          `[llm:cli] ${this.bin} exited ${exitCode}: ${stderr.slice(0, 500)}`
        );
      }
      return stdout.trim();
    } finally {
      clearTimeout(timeout);
    }
  }
}
