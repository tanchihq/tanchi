export type LlmResearchInput = Readonly<{
  prompt: string;
  timeoutMs?: number;
}>;

export type LlmGenerateInput = Readonly<{
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}>;

export interface LlmProvider {
  research(input: LlmResearchInput): Promise<string>;
  generate(input: LlmGenerateInput): Promise<string>;
}
