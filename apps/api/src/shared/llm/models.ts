export type AgentKey =
  | "chasseur"
  | "profiler"
  | "copywriter"
  | "analyste"
  | "reward"
  | "chat";

export const DEFAULT_MODEL = "claude-sonnet-5";

export const AGENT_DEFAULTS: Readonly<Record<AgentKey, string>> = {
  chasseur: "claude-sonnet-5",
  profiler: "claude-opus-4-8",
  copywriter: "claude-sonnet-5",
  analyste: "claude-sonnet-5",
  reward: "claude-haiku-4-5",
  chat: "claude-sonnet-5",
};

export const ALLOWED_MODELS: ReadonlySet<string> = new Set([
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
]);

export function agentModel(agent: AgentKey): string {
  const override = process.env[`LLM_MODEL_${agent.toUpperCase()}`];
  if (override !== undefined && ALLOWED_MODELS.has(override)) return override;
  return AGENT_DEFAULTS[agent];
}
