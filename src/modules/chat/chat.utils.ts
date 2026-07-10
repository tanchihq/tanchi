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
