import type { SourcingProvider } from "./types.ts";
import { HunterProvider } from "./hunter.ts";

export function createSourcingProvider(
  provider: string,
  apiKey: string
): SourcingProvider {
  switch (provider) {
    case "hunter":
      return new HunterProvider(apiKey);
    default:
      throw new Error(`[sourcing] unsupported provider: ${provider}`);
  }
}

export type { SourcedEmail, SourcingProvider } from "./types.ts";
