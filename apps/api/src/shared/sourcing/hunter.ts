import type { SourcedEmail, SourcingProvider } from "./types.ts";

const HUNTER_TIMEOUT_MS = 20000;

type HunterEmail = Readonly<{
  value: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  confidence: number | null;
}>;

type HunterResponse = Readonly<{
  data?: Readonly<{ emails?: ReadonlyArray<HunterEmail> }>;
}>;

export class HunterProvider implements SourcingProvider {
  readonly name = "hunter";

  constructor(private readonly apiKey: string) {}

  async enrichDomain(domain: string): Promise<ReadonlyArray<SourcedEmail>> {
    const url =
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}` +
      `&api_key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(HUNTER_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(
        `[sourcing:hunter] domain-search ${domain} failed: ${response.status}`
      );
    }
    const body = (await response.json()) as HunterResponse;
    const emails = body.data?.emails ?? [];
    return emails.map((email) => ({
      email: email.value,
      firstName: email.first_name,
      lastName: email.last_name,
      role: email.position,
      confidence: email.confidence,
    }));
  }
}
