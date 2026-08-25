import type { ProviderKey } from "./models.ts";

export type ResearchMode = "native" | "unsupported";

export const RESEARCH_SUPPORT: Readonly<Record<ProviderKey, ResearchMode>> = {
  anthropic: "native",
  openai: "native",
  gemini: "native",
  kimi: "native",
};

export const NO_RESEARCH_REASON =
  "this provider exposes no usable web search";
