import type {
  PgQueueFact,
  PgQueueRow,
} from "./repository/queue/queue.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

export function convertToQueueItemDto(
  row: PgQueueRow,
  leadFacts: ReadonlyArray<PgQueueFact>
): ResponseDto.QueueItemDto {
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
    subject: row.subject,
    facts: leadFacts.map((fact) => ({
      text: fact.text,
      sourceUrl: fact.source_url,
    })),
    angle: row.angle_type ?? "",
    message: row.body,
  };
}
