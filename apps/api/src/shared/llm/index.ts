import { env } from "../../env.ts";
import type { LlmProvider } from "./types.ts";
import { ClaudeCliProvider } from "./cli.ts";
import { AnthropicApiProvider } from "./api.ts";
import { OpenAiCompatibleProvider } from "./openai-compatible.ts";
import { GeminiProvider } from "./gemini.ts";
import { NO_RESEARCH_REASON, RESEARCH_SUPPORT } from "./capabilities.ts";
import {
  agentModelFor,
  DEFAULT_MODELS,
  type AgentKey,
  type ProviderKey,
} from "./models.ts";

type ProviderSetting = typeof env.LLM_PROVIDER;

function normalizeProvider(setting: ProviderSetting): ProviderKey | "cli" {
  if (setting === "cli") return "cli";
  if (setting === "api") return "anthropic";
  return setting;
}

function buildProvider(key: ProviderKey | "cli"): LlmProvider {
  switch (key) {
    case "cli":
      return new ClaudeCliProvider(env.CLAUDE_CLI_BIN, env.CLAUDE_CLI_TIMEOUT_MS);
    case "anthropic":
      return new AnthropicApiProvider(
        env.ANTHROPIC_API_KEY,
        DEFAULT_MODELS.anthropic
      );
    case "openai":
      return new OpenAiCompatibleProvider({
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL,
        model: DEFAULT_MODELS.openai,
        label: "openai",
        keyEnvName: "OPENAI_API_KEY",
        researchStrategy: "responses",
      });
    case "gemini":
      return new GeminiProvider(env.GEMINI_API_KEY, DEFAULT_MODELS.gemini);
    case "kimi":
      return new OpenAiCompatibleProvider({
        apiKey: env.MOONSHOT_API_KEY,
        baseUrl: env.MOONSHOT_BASE_URL,
        model: DEFAULT_MODELS.kimi,
        label: "kimi",
        keyEnvName: "MOONSHOT_API_KEY",
        researchStrategy: "moonshot-builtin",
      });
  }
}

function supportsResearch(key: ProviderKey | "cli"): boolean {
  return key === "cli" || RESEARCH_SUPPORT[key] === "native";
}

const activeProviderKey = normalizeProvider(env.LLM_PROVIDER);

const researchProviderKey = normalizeProvider(
  env.LLM_RESEARCH_PROVIDER ?? env.LLM_PROVIDER
);

export const activeProvider: ProviderKey =
  activeProviderKey === "cli" ? "anthropic" : activeProviderKey;

export const activeProviderLabel: string = activeProviderKey;

export const researchProviderLabel: string = researchProviderKey;

export const isResearchAvailable: boolean = supportsResearch(researchProviderKey);

export const researchUnavailableReason: string | null = isResearchAvailable
  ? null
  : NO_RESEARCH_REASON;

const generationProvider = buildProvider(activeProviderKey);

const researchProvider =
  researchProviderKey === activeProviderKey
    ? generationProvider
    : buildProvider(researchProviderKey);

class RoutedLlmProvider implements LlmProvider {
  constructor(
    private readonly generation: LlmProvider,
    private readonly research_: LlmProvider
  ) {}

  research(input: Parameters<LlmProvider["research"]>[0]): Promise<string> {
    if (!isResearchAvailable) {
      throw new Error(
        `[llm] web research is unavailable: provider '${researchProviderKey}' — ${researchUnavailableReason}. Set LLM_RESEARCH_PROVIDER to a provider with web search.`
      );
    }
    return this.research_.research(input);
  }

  generate(input: Parameters<LlmProvider["generate"]>[0]): Promise<string> {
    return this.generation.generate(input);
  }

  stream(input: Parameters<LlmProvider["stream"]>[0]): AsyncIterable<string> {
    return this.generation.stream(input);
  }

  agent(
    input: Parameters<LlmProvider["agent"]>[0]
  ): ReturnType<LlmProvider["agent"]> {
    return this.generation.agent(input);
  }
}

export const llm: LlmProvider = new RoutedLlmProvider(
  generationProvider,
  researchProvider
);

export function agentModel(agent: AgentKey): string {
  return agentModelFor(agent, activeProvider);
}

export const DEFAULT_MODEL = DEFAULT_MODELS[activeProvider];

export type { AgentKey, ProviderKey };

export type {
  LlmProvider,
  LlmGenerateInput,
  LlmResearchInput,
  LlmAgentEvent,
  LlmAgentInput,
  LlmMcpServer,
  LlmToolInvocation,
  LlmToolSpec,
} from "./types.ts";
