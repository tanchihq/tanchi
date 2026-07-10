import type {
  PgAttachedLead,
  PgChatMessage,
  PgConversation,
} from "./repository/chat/chat.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

function fullName(
  firstName: string | null,
  lastName: string | null
): string {
  return [firstName, lastName]
    .filter((part) => part !== null && part !== "")
    .join(" ");
}

export function convertPgConversationToSummaryDto(
  conversation: PgConversation
): ResponseDto.ConversationSummaryDto {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at.toISOString(),
    updatedAt: conversation.updated_at.toISOString(),
  };
}

export function convertPgChatMessageToDto(
  message: PgChatMessage
): ResponseDto.ChatMessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at.toISOString(),
  };
}

export function convertPgAttachedLeadToDto(
  lead: PgAttachedLead
): ResponseDto.AttachedLeadDto {
  return {
    leadId: lead.lead_id,
    name: fullName(lead.first_name, lead.last_name),
    company: lead.company_name ?? "",
    stage: lead.stage,
  };
}

export function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function parseDate(value: string | null): Date | null {
  if (value === null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extractJson(raw: string): unknown {
  const fenced = raw.replace(/```json/gi, "```");
  const withoutFences = fenced.replace(/```/g, "");
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in LLM output");
  }
  return JSON.parse(withoutFences.slice(start, end + 1));
}
