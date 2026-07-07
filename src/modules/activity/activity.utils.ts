import type {
  PgActivity,
  PgActivityStatusRow,
} from "./repository/activity/activity.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

export function convertPgActivityToItemDto(
  activity: PgActivity
): ResponseDto.ActivityItemDto {
  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    leadId: activity.lead_id,
    createdAt: activity.created_at.toISOString(),
  };
}

export function buildStatusDto(
  row: PgActivityStatusRow | null,
  nextRunAt: Date
): ResponseDto.ActivityStatusDto {
  const lastRunStarted = row?.last_run_started ?? null;
  const lastRunDone = row?.last_run_done ?? null;
  const isRunning =
    lastRunStarted !== null &&
    (lastRunDone === null || lastRunStarted > lastRunDone);
  const lastRun = lastRunDone ?? lastRunStarted;

  return {
    isRunning,
    lastRunAt: lastRun?.toISOString() ?? null,
    nextRunAt: nextRunAt.toISOString(),
    today: {
      researched: row?.researched_today ?? 0,
      drafted: row?.drafted_today ?? 0,
      sent: row?.sent_today ?? 0,
      replies: row?.replies_today ?? 0,
    },
  };
}
