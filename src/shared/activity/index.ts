import { db } from "../../db.ts";

export type ActivityType =
  | "run_started"
  | "run_done"
  | "sourced"
  | "profiled"
  | "drafted"
  | "sent"
  | "reply"
  | "follow_up"
  | "closed";

export type ActivityInput = Readonly<{
  organizationId: string;
  type: ActivityType;
  title: string;
  leadId?: string | null;
}>;

export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    await db`
      INSERT INTO activity (id, organization_id, type, title, lead_id)
      VALUES (
        ${Bun.randomUUIDv7()},
        ${input.organizationId},
        ${input.type},
        ${input.title},
        ${input.leadId ?? null}
      )
    `;
  } catch (error) {
    console.error(
      `[activity] record failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
