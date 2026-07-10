import type {
  LlmAgentEvent,
  LlmAgentInput,
  LlmGenerateInput,
  LlmProvider,
  LlmResearchInput,
} from "./types.ts";

const RESEARCH_TOOLS = "WebSearch WebFetch";

type StreamLineResult = Readonly<{
  events: ReadonlyArray<LlmAgentEvent>;
  resultText: string | null;
}>;

function stripMcpPrefix(name: string, serverName: string): string {
  const prefix = `mcp__${serverName}__`;
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

function eventsFromStreamEvent(
  event: unknown,
  serverName: string
): ReadonlyArray<LlmAgentEvent> {
  if (typeof event !== "object" || event === null) return [];
  const record = event as Record<string, unknown>;
  if (record.type === "content_block_delta") {
    const delta = record.delta as Record<string, unknown> | undefined;
    if (
      delta?.type === "text_delta" &&
      typeof delta.text === "string" &&
      delta.text !== ""
    ) {
      return [{ type: "text", text: delta.text }];
    }
    return [];
  }
  if (record.type === "content_block_start") {
    const block = record.content_block as Record<string, unknown> | undefined;
    if (block?.type === "tool_use" && typeof block.name === "string") {
      return [{ type: "action", name: stripMcpPrefix(block.name, serverName) }];
    }
    return [];
  }
  return [];
}

function parseStreamLine(line: string, serverName: string): StreamLineResult {
  const trimmed = line.trim();
  if (trimmed === "") return { events: [], resultText: null };
  const parsed = ((): unknown => {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  })();
  if (typeof parsed !== "object" || parsed === null) {
    return { events: [], resultText: null };
  }
  const record = parsed as Record<string, unknown>;
  if (record.type === "stream_event") {
    return {
      events: eventsFromStreamEvent(record.event, serverName),
      resultText: null,
    };
  }
  if (record.type === "result" && typeof record.result === "string") {
    return { events: [], resultText: record.result };
  }
  return { events: [], resultText: null };
}

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

  async *agent(input: LlmAgentInput): AsyncIterable<LlmAgentEvent> {
    if (input.mcp === undefined) {
      const text = await this.generate({
        prompt: input.prompt,
        ...(input.system !== undefined && { system: input.system }),
        ...(input.maxTokens !== undefined && { maxTokens: input.maxTokens }),
        ...(input.temperature !== undefined && {
          temperature: input.temperature,
        }),
      });
      yield { type: "text", text };
      return;
    }

    const mcp = input.mcp;
    const mcpConfig = JSON.stringify({
      mcpServers: {
        [mcp.serverName]: {
          command: mcp.command,
          args: [...mcp.args],
          env: mcp.env,
        },
      },
    });
    const args = [
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--include-partial-messages",
      "--strict-mcp-config",
      "--mcp-config",
      mcpConfig,
      ...(input.system === undefined
        ? []
        : ["--append-system-prompt", input.system]),
      "--allowedTools",
      ...mcp.toolNames,
    ];

    const process = Bun.spawn([this.bin, ...args], {
      stdin: new TextEncoder().encode(input.prompt),
      stdout: "pipe",
      stderr: "pipe",
    });
    const timeout = setTimeout(() => {
      process.kill();
    }, this.defaultTimeoutMs);

    try {
      const decoder = new TextDecoder();
      let buffer = "";
      let emittedText = false;
      let resultText = "";
      for await (const chunk of process.stdout) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const parsed = parseStreamLine(line, mcp.serverName);
          for (const event of parsed.events) {
            if (event.type === "text") emittedText = true;
            yield event;
          }
          if (parsed.resultText !== null) resultText = parsed.resultText;
        }
      }
      const rest = buffer + decoder.decode();
      const tailParsed = parseStreamLine(rest, mcp.serverName);
      for (const event of tailParsed.events) {
        if (event.type === "text") emittedText = true;
        yield event;
      }
      if (tailParsed.resultText !== null) resultText = tailParsed.resultText;
      if (!emittedText && resultText !== "") {
        yield { type: "text", text: resultText };
      }

      const exitCode = await process.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(process.stderr).text();
        throw new Error(
          `[llm:cli] agent ${this.bin} exited ${exitCode}: ${stderr.slice(0, 500)}`
        );
      }
    } finally {
      clearTimeout(timeout);
    }
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
