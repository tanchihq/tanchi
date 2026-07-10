import Anthropic from "@anthropic-ai/sdk";
import type {
  LlmGenerateInput,
  LlmProvider,
  LlmResearchInput,
} from "./types.ts";

const RESEARCH_MAX_TOKENS = 8000;
const GENERATE_MAX_TOKENS = 4000;
const WEB_SEARCH_MAX_USES = 8;

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
      model: this.model,
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
      model: this.model,
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
      model: this.model,
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
}
