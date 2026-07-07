import type { PgMessageHistoryRow } from "./repository/messages/messages.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

export function convertPgMessageHistoryRowToDto(
  row: PgMessageHistoryRow
): ResponseDto.MessageHistoryDto {
  const name = [row.first_name, row.last_name]
    .filter((part) => part !== null && part !== "")
    .join(" ");
  return {
    id: row.id,
    leadId: row.lead_id,
    prospectName: name,
    company: row.company_name ?? "",
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    status: row.status,
    sentAt: row.sent_at?.toISOString() ?? null,
    replyClassification: row.reply_classification,
    createdAt: row.created_at.toISOString(),
  };
}
