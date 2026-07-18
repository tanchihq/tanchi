import { PostHog } from "posthog-node";
import { env } from "../../env.ts";

type EventProperties = Readonly<
  Record<string, string | number | boolean | null>
>;

type CaptureInput = Readonly<{
  distinctId: string;
  event: string;
  properties?: EventProperties;
  personProperties?: EventProperties;
}>;

const client =
  env.POSTHOG_API_KEY === undefined || env.POSTHOG_API_KEY === ""
    ? null
    : new PostHog(env.POSTHOG_API_KEY, { host: env.POSTHOG_HOST });

export function captureEvent(input: CaptureInput): void {
  if (client === null) return;
  try {
    client.capture({
      distinctId: input.distinctId,
      event: input.event,
      properties: {
        ...(input.properties ?? {}),
        ...(input.personProperties !== undefined
          ? { $set: input.personProperties }
          : {}),
      },
    });
  } catch (error) {
    console.error(
      `[analytics] capture failed event=${input.event}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function shutdownAnalytics(): Promise<void> {
  if (client === null) return;
  await client.shutdown();
}
