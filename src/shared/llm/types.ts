export type LlmResearchInput = Readonly<{
  prompt: string;
  model?: string;
  timeoutMs?: number;
}>;

export type LlmGenerateInput = Readonly<{
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}>;

export type LlmToolSpec = Readonly<{
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}>;

export type LlmToolInvocation = Readonly<{
  name: string;
  input: Record<string, unknown>;
}>;

export type LlmAgentEvent =
  | Readonly<{ type: "text"; text: string }>
  | Readonly<{ type: "action"; name: string }>;

export type LlmMcpServer = Readonly<{
  serverName: string;
  command: string;
  args: ReadonlyArray<string>;
  env: Readonly<Record<string, string>>;
  toolNames: ReadonlyArray<string>;
}>;

export type LlmAgentInput = Readonly<{
  system?: string;
  prompt: string;
  tools: ReadonlyArray<LlmToolSpec>;
  execute: (call: LlmToolInvocation) => Promise<string>;
  mcp?: LlmMcpServer;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxSteps?: number;
}>;

export interface LlmProvider {
  research(input: LlmResearchInput): Promise<string>;
  generate(input: LlmGenerateInput): Promise<string>;
  stream(input: LlmGenerateInput): AsyncIterable<string>;
  agent(input: LlmAgentInput): AsyncIterable<LlmAgentEvent>;
}
