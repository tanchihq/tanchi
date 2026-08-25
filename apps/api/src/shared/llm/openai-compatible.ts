import OpenAI from "openai";
import type {
  LlmAgentEvent,
  LlmAgentInput,
  LlmGenerateInput,
  LlmProvider,
  LlmResearchInput,
} from "./types.ts";

const RESEARCH_MAX_TOKENS = 8000;
const RESEARCH_MAX_STEPS = 8;
const MOONSHOT_SEARCH_TOOL = "$web_search";
const GENERATE_MAX_TOKENS = 4000;
const AGENT_DEFAULT_MAX_STEPS = 6;

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type ResearchStrategy = "responses" | "moonshot-builtin" | "none";

export type OpenAiCompatibleConfig = Readonly<{
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
  label: string;
  keyEnvName: string;
  researchStrategy: ResearchStrategy;
}>;

type MoonshotSearchToolMessage = Readonly<{
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}>;

type FunctionToolCall = Readonly<{
  id: string;
  function: Readonly<{ name: string; arguments: string }>;
}>;

function isFunctionToolCall(call: unknown): call is FunctionToolCall {
  if (typeof call !== "object" || call === null) return false;
  const record = call as Record<string, unknown>;
  const fn = record.function;
  if (typeof fn !== "object" || fn === null) return false;
  const fnRecord = fn as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof fnRecord.name === "string" &&
    typeof fnRecord.arguments === "string"
  );
}

export class OpenAiCompatibleProvider implements LlmProvider {
  private cachedClient: OpenAI | null = null;

  constructor(private readonly config: OpenAiCompatibleConfig) {}

  private getClient(): OpenAI {
    if (this.config.apiKey === undefined) {
      throw new Error(
        `[llm] LLM_PROVIDER=${this.config.label} requires ${this.config.keyEnvName}`
      );
    }
    if (this.cachedClient === null) {
      this.cachedClient = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
      });
    }
    return this.cachedClient;
  }

  private buildMessages(input: LlmGenerateInput): ReadonlyArray<ChatMessage> {
    return input.system === undefined
      ? [{ role: "user", content: input.prompt }]
      : [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ];
  }

  research(input: LlmResearchInput): Promise<string> {
    switch (this.config.researchStrategy) {
      case "responses":
        return this.researchWithResponsesApi(input);
      case "moonshot-builtin":
        return this.researchWithMoonshotSearch(input);
      case "none":
        return Promise.reject(
          new Error(
            `[llm] provider ${this.config.label} does not support web research`
          )
        );
    }
  }

  private async researchWithResponsesApi(
    input: LlmResearchInput
  ): Promise<string> {
    const response = await this.getClient().responses.create({
      model: input.model ?? this.config.model,
      input: input.prompt,
      max_output_tokens: RESEARCH_MAX_TOKENS,
      tools: [{ type: "web_search" }],
    });
    return response.output_text.trim();
  }

  private async researchWithMoonshotSearch(
    input: LlmResearchInput
  ): Promise<string> {
    const searchTool = {
      type: "builtin_function",
      function: { name: MOONSHOT_SEARCH_TOOL },
    } as unknown as OpenAI.Chat.Completions.ChatCompletionTool;

    let messages: Array<ChatMessage> = [
      { role: "user", content: input.prompt },
    ];

    let step = 0;
    while (step < RESEARCH_MAX_STEPS) {
      step += 1;
      const completion = await this.getClient().chat.completions.create({
        model: input.model ?? this.config.model,
        max_completion_tokens: RESEARCH_MAX_TOKENS,
        messages,
        tools: [searchTool],
      });

      const choice = completion.choices[0];
      if (choice === undefined) return "";

      if (choice.finish_reason !== "tool_calls") {
        return (choice.message.content ?? "").trim();
      }

      const rawCalls: ReadonlyArray<unknown> = choice.message.tool_calls ?? [];
      const searchCalls = rawCalls.filter(isFunctionToolCall);
      if (searchCalls.length === 0) {
        return (choice.message.content ?? "").trim();
      }

      const relayed: ReadonlyArray<ChatMessage> = searchCalls.map(
        (call) =>
          ({
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: call.function.arguments,
          }) satisfies MoonshotSearchToolMessage as unknown as ChatMessage
      );

      messages = [...messages, choice.message, ...relayed];
    }

    throw new Error(
      `[llm] ${this.config.label} web research did not settle within ${RESEARCH_MAX_STEPS} search rounds`
    );
  }

  async generate(input: LlmGenerateInput): Promise<string> {
    const completion = await this.getClient().chat.completions.create({
      model: input.model ?? this.config.model,
      max_completion_tokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
      ...(input.temperature !== undefined && {
        temperature: input.temperature,
      }),
      messages: [...this.buildMessages(input)],
    });
    return completion.choices[0]?.message.content ?? "";
  }

  async *stream(input: LlmGenerateInput): AsyncIterable<string> {
    const stream = await this.getClient().chat.completions.create({
      model: input.model ?? this.config.model,
      max_completion_tokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
      ...(input.temperature !== undefined && {
        temperature: input.temperature,
      }),
      messages: [...this.buildMessages(input)],
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content;
      if (delta !== undefined && delta !== null && delta !== "") yield delta;
    }
  }

  async *agent(input: LlmAgentInput): AsyncIterable<LlmAgentEvent> {
    const tools: ReadonlyArray<OpenAI.Chat.Completions.ChatCompletionTool> =
      input.tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
    const maxSteps = input.maxSteps ?? AGENT_DEFAULT_MAX_STEPS;
    let messages: Array<ChatMessage> = [
      ...this.buildMessages({ prompt: input.prompt, ...(input.system !== undefined && { system: input.system }) }),
    ];

    let step = 0;
    while (step < maxSteps) {
      step += 1;
      const completion = await this.getClient().chat.completions.create({
        model: input.model ?? this.config.model,
        max_completion_tokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
        ...(input.temperature !== undefined && {
          temperature: input.temperature,
        }),
        messages,
        ...(tools.length > 0 && { tools: [...tools] }),
      });

      const choice = completion.choices[0];
      if (choice === undefined) return;

      const text = choice.message.content;
      if (text !== null && text !== "") yield { type: "text", text };

      const toolCalls = choice.message.tool_calls ?? [];
      if (toolCalls.length === 0) return;

      messages = [...messages, choice.message];
      const results = await Promise.all(
        toolCalls.map(async (call) => {
          if (call.type !== "function") return null;
          const output = await input.execute({
            name: call.function.name,
            input: parseArguments(call.function.arguments),
          });
          return { callId: call.id, name: call.function.name, output };
        })
      );

      const resolved = results.filter(
        (result): result is { callId: string; name: string; output: string } =>
          result !== null
      );
      const actions = resolved.map(
        (result): LlmAgentEvent => ({ type: "action", name: result.name })
      );
      yield* actions;

      messages = [
        ...messages,
        ...resolved.map(
          (result): ChatMessage => ({
            role: "tool",
            tool_call_id: result.callId,
            content: result.output,
          })
        ),
      ];
    }
  }
}

function parseArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
