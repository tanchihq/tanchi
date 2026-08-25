const PROVIDER_LABELS: Readonly<Record<string, string>> = {
  cli: 'Claude (local CLI)',
  api: 'Claude (Anthropic API)',
  anthropic: 'Claude (Anthropic API)',
  openai: 'GPT (OpenAI)',
  gemini: 'Gemini (Google)',
  kimi: 'Kimi (Moonshot)',
};

const AGENT_LABELS: Readonly<Record<string, string>> = {
  chasseur: 'Finding prospects',
  profiler: 'Researching and qualifying',
  copywriter: 'Writing messages',
  analyste: 'Weekly review of what works',
  chat: 'Copilot',
};

export const providerLabel = (key: string): string =>
  PROVIDER_LABELS[key] ?? key;

export const agentLabel = (key: string): string => AGENT_LABELS[key] ?? key;

const VENDOR_LABELS: Readonly<Record<string, string>> = {
  cli: 'Claude',
  api: 'Claude',
  anthropic: 'Claude',
  openai: 'GPT',
  gemini: 'Gemini',
  kimi: 'Kimi',
};

export const vendorLabel = (key: string): string => VENDOR_LABELS[key] ?? key;
