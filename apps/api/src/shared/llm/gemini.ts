import { GoogleGenAI, type Content, type Part } from "@google/genai";
import type {
  LlmAgentEvent,
  LlmAgentInput,
  LlmGenerateInput,
  LlmProvider,
  LlmResearchInput,
} from "./types.ts";

const GENERATE_MAX_TOKENS = 4000;
const RESEARCH_MAX_TOKENS = 8000;
const AGENT_DEFAULT_MAX_STEPS = 6;

export class GeminiProvider implements LlmProvider {
  private cachedClient: GoogleGenAI | null = null;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string
  ) {}

  private getClient(): GoogleGenAI {
    if (this.apiKey === undefined) {
      throw new Error("[llm] LLM_PROVIDER=gemini requires GEMINI_API_KEY");
    }
    if (this.cachedClient === null) {
      this.cachedClient = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.cachedClient;
  }

  async research(input: LlmResearchInput): Promise<string> {
    const response = await this.getClient().models.generateContent({
      model: input.model ?? this.model,
      contents: input.prompt,
      config: {
        maxOutputTokens: RESEARCH_MAX_TOKENS,
        tools: [{ googleSearch: {} }],
      },
    });
    return (response.text ?? "").trim();
  }

  async generate(input: LlmGenerateInput): Promise<string> {
    const response = await this.getClient().models.generateContent({
      model: input.model ?? this.model,
      contents: input.prompt,
      config: {
        maxOutputTokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
        ...(input.temperature !== undefined && {
          temperature: input.temperature,
        }),
        ...(input.system !== undefined && {
          systemInstruction: input.system,
        }),
      },
    });
    return response.text ?? "";
  }

  async *stream(input: LlmGenerateInput): AsyncIterable<string> {
    const stream = await this.getClient().models.generateContentStream({
      model: input.model ?? this.model,
      contents: input.prompt,
      config: {
        maxOutputTokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
        ...(input.temperature !== undefined && {
          temperature: input.temperature,
        }),
        ...(input.system !== undefined && {
          systemInstruction: input.system,
        }),
      },
    });
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text !== undefined && text !== "") yield text;
    }
  }

  async *agent(input: LlmAgentInput): AsyncIterable<LlmAgentEvent> {
    const functionDeclarations = input.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parametersJsonSchema: tool.inputSchema,
    }));
    const maxSteps = input.maxSteps ?? AGENT_DEFAULT_MAX_STEPS;
    let contents: Array<Content> = [
      { role: "user", parts: [{ text: input.prompt }] },
    ];

    let step = 0;
    while (step < maxSteps) {
      step += 1;
      const response = await this.getClient().models.generateContent({
        model: input.model ?? this.model,
        contents,
        config: {
          maxOutputTokens: input.maxTokens ?? GENERATE_MAX_TOKENS,
          ...(input.temperature !== undefined && {
            temperature: input.temperature,
          }),
          ...(input.system !== undefined && {
            systemInstruction: input.system,
          }),
          ...(functionDeclarations.length > 0 && {
            tools: [{ functionDeclarations }],
          }),
        },
      });

      const text = response.text;
      if (text !== undefined && text !== "") yield { type: "text", text };

      const calls = response.functionCalls ?? [];
      if (calls.length === 0) return;

      const named = calls.filter(
        (call): call is typeof call & { name: string } =>
          call.name !== undefined
      );

      const results = await Promise.all(
        named.map(async (call) => ({
          name: call.name,
          output: await input.execute({
            name: call.name,
            input: (call.args ?? {}) as Record<string, unknown>,
          }),
        }))
      );

      yield* results.map(
        (result): LlmAgentEvent => ({ type: "action", name: result.name })
      );

      const responseParts: ReadonlyArray<Part> = results.map((result) => ({
        functionResponse: {
          name: result.name,
          response: { output: result.output },
        },
      }));

      contents = [
        ...contents,
        { role: "model", parts: response.candidates?.[0]?.content?.parts ?? [] },
        { role: "user", parts: [...responseParts] },
      ];
    }
  }
}
