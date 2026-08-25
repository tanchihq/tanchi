export type AgentKey =
  | "chasseur"
  | "profiler"
  | "copywriter"
  | "analyste"
  | "reward"
  | "chat";

export type ProviderKey = "anthropic" | "openai" | "gemini" | "kimi";

const ANTHROPIC_MODELS: ReadonlySet<string> = new Set([
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
]);

const OPENAI_MODELS: ReadonlySet<string> = new Set([
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.2-chat-latest",
  "gpt-5.2-mini",
  "gpt-5.2-nano",
]);

const GEMINI_MODELS: ReadonlySet<string> = new Set([
  "gemini-3.1-pro-preview",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
]);

const KIMI_MODELS: ReadonlySet<string> = new Set([
  "kimi-k3",
  "kimi-k2-0905-preview",
  "kimi-latest",
]);

export const ALLOWED_MODELS: Readonly<Record<ProviderKey, ReadonlySet<string>>> =
  {
    anthropic: ANTHROPIC_MODELS,
    openai: OPENAI_MODELS,
    gemini: GEMINI_MODELS,
    kimi: KIMI_MODELS,
  };

export const DEFAULT_MODELS: Readonly<Record<ProviderKey, string>> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-5.6-terra",
  gemini: "gemini-3.7-flash",
  kimi: "kimi-k3",
};

const AGENT_DEFAULTS: Readonly<
  Record<ProviderKey, Readonly<Record<AgentKey, string>>>
> = {
  anthropic: {
    chasseur: "claude-sonnet-5",
    profiler: "claude-opus-4-8",
    copywriter: "claude-sonnet-5",
    analyste: "claude-sonnet-5",
    reward: "claude-haiku-4-5",
    chat: "claude-sonnet-5",
  },
  openai: {
    chasseur: "gpt-5.6-terra",
    profiler: "gpt-5.6-sol",
    copywriter: "gpt-5.6-terra",
    analyste: "gpt-5.6-terra",
    reward: "gpt-5.6-luna",
    chat: "gpt-5.6-terra",
  },
  gemini: {
    chasseur: "gemini-3.7-flash",
    profiler: "gemini-3.1-pro-preview",
    copywriter: "gemini-3.7-flash",
    analyste: "gemini-3.7-flash",
    reward: "gemini-3.5-flash-lite",
    chat: "gemini-3.7-flash",
  },
  kimi: {
    chasseur: "kimi-k3",
    profiler: "kimi-k3",
    copywriter: "kimi-k3",
    analyste: "kimi-k3",
    reward: "kimi-k3",
    chat: "kimi-k3",
  },
};

export const DEFAULT_MODEL = DEFAULT_MODELS.anthropic;

export function agentModelFor(
  agent: AgentKey,
  provider: ProviderKey
): string {
  const override = process.env[`LLM_MODEL_${agent.toUpperCase()}`];
  const allowed = ALLOWED_MODELS[provider];
  if (override !== undefined && allowed.has(override)) return override;
  return AGENT_DEFAULTS[provider][agent];
}
