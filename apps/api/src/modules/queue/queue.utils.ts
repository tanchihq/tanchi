import type {
  PgQueueFact,
  PgQueueRow,
  PgQueueSkipReason,
} from "./repository/queue/queue.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

function profileUrlOf(row: PgQueueRow): string | null {
  if (row.channel === "linkedin") return row.linkedin_url;
  if (row.channel === "instagram") return row.instagram_url;
  return null;
}

function convertPreviousMessage(
  row: PgQueueRow
): ResponseDto.QueuePreviousMessageDto | null {
  if (row.previous_body === null) return null;
  return {
    subject: row.previous_subject,
    body: row.previous_body,
    sentAt: row.previous_sent_at?.toISOString() ?? null,
  };
}

function convertChosenAngle(row: PgQueueRow): ResponseDto.QueueAngleDto | null {
  if (row.angle_title === null) return null;
  return {
    title: row.angle_title,
    note: row.angle_note,
    fact:
      row.angle_fact_text === null || row.angle_fact_source_url === null
        ? null
        : { text: row.angle_fact_text, sourceUrl: row.angle_fact_source_url },
  };
}

export function convertToQueueItemDto(
  row: PgQueueRow,
  leadFacts: ReadonlyArray<PgQueueFact>,
  autopilotEnabled: boolean
): ResponseDto.QueueItemDto {
  const isFollowUp = row.sequence_step > 0;
  return {
    id: row.lead_id,
    messageId: row.message_id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    role: row.role,
    company: row.company_name ?? "",
    channel: row.channel,
    hot: row.hot,
    done: row.status === "sent",
    status: row.status,
    subject: row.subject,
    facts: leadFacts.map((fact) => ({
      text: fact.text,
      sourceUrl: fact.source_url,
    })),
    angle: row.angle_type ?? "",
    chosenAngle: convertChosenAngle(row),
    message: row.body,
    kind: isFollowUp ? "follow-up" : "first-touch",
    followUpNumber: isFollowUp ? row.sequence_step : 0,
    previousMessage: convertPreviousMessage(row),
    email: row.email,
    profileUrl: profileUrlOf(row),
    score: row.score,
    qualification: row.qualification,
    autoSend: autopilotEnabled && row.channel === "email" && row.email !== null,
  };
}

export function latestPreparedAt(
  rows: ReadonlyArray<PgQueueRow>
): string | null {
  const latest = rows.reduce<Date | null>(
    (current, row) =>
      current === null || row.message_created_at > current
        ? row.message_created_at
        : current,
    null
  );
  return latest?.toISOString() ?? null;
}

export function nextStepAfterSkip(
  reason: PgQueueSkipReason | null
): ResponseDto.QueueSkipNextStepDto {
  if (reason === "wrong_lead") return "excluded";
  if (reason === "not_now") return "snoozed";
  return "redraft";
}
