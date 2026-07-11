import Anthropic from "@anthropic-ai/sdk";
import type {
  LlmAgentEvent,
  LlmAgentInput,
  LlmGenerateInput,
  LlmProvider,
  LlmResearchInput,
} from "./types.ts";

const RESEARCH_MAX_TOKENS = 8000;
const GENERATE_MAX_TOKENS = 4000;
const WEB_SEARCH_MAX_USES = 8;
const AGENT_DEFAULT_MAX_STEPS = 6;

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    )
    .map((block) => block.text)
    .join("");
}

export class AnthropicApiProvider implements LlmProvider {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async research(input: LlmResearchInput): Promise<string> {
    const message = await this.client.messages.create({
      model: input.model ?? this.model,
      max_tokens: RESEARCH_MAX_TOKENS,
      messages: [{ role: "user", content: input.prompt }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: WEB_SEARCH_MAX_USES,
        },
      ],
    });
    return extractText(message);
  }

  async generate(input: LlmGenerateInput): Promise<string> {
    const message = await this.client.messages.create({
      model: input.model ?? this.model,
      max_tokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
      ...(input.temperature !== undefined && {
        temperature: input.temperature,
      }),
      ...(input.system !== undefined && { system: input.system }),
      messages: [{ role: "user", content: input.prompt }],
    });
    return extractText(message);
  }

  async *stream(input: LlmGenerateInput): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: input.model ?? this.model,
      max_tokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
      ...(input.temperature !== undefined && {
        temperature: input.temperature,
      }),
      ...(input.system !== undefined && { system: input.system }),
      messages: [{ role: "user", content: input.prompt }],
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  async *agent(input: LlmAgentInput): AsyncIterable<LlmAgentEvent> {
    const tools: ReadonlyArray<Anthropic.Tool> = input.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }));
    const maxSteps = input.maxSteps ?? AGENT_DEFAULT_MAX_STEPS;
    let messages: Array<Anthropic.MessageParam> = [
      { role: "user", content: input.prompt },
    ];

    let step = 0;
    while (step < maxSteps) {
      step += 1;
      const stream = this.client.messages.stream({
        model: input.model ?? this.model,
        max_tokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
        ...(input.temperature !== undefined && {
          temperature: input.temperature,
        }),
        ...(input.system !== undefined && { system: input.system }),
        messages,
        tools: [...tools],
      });
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { type: "text", text: event.delta.text };
        }
      }

      const final = await stream.finalMessage();
      const toolUses = final.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );
      if (toolUses.length === 0) return;

      messages = [...messages, { role: "assistant", content: final.content }];
      const results: Array<Anthropic.ToolResultBlockParam> = [];
      for (const toolUse of toolUses) {
        yield { type: "action", name: toolUse.name };
        const output = await input.execute({
          name: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
        });
        results.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: output,
        });
      }
      messages = [...messages, { role: "user", content: results }];
    }
  }
}
