export const CHANNELS = [
  "email",
  "linkedin",
  "whatsapp",
  "instagram",
  "sms",
  "cold_call",
] as const;

export type Channel = (typeof CHANNELS)[number];

export const AUTO_CHANNELS: ReadonlyArray<Channel> = ["email"];
