export type ChatRoleDto = "user" | "assistant";

export type ChatMessageDto = Readonly<{
  id: string;
  role: ChatRoleDto;
  content: string;
  createdAt: string;
}>;

export type AttachedLeadDto = Readonly<{
  leadId: string;
  name: string;
  company: string;
  stage: string;
}>;

export type ConversationSummaryDto = Readonly<{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ConversationListDto = ReadonlyArray<ConversationSummaryDto>;

export type ConversationDetailDto = Readonly<{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ReadonlyArray<ChatMessageDto>;
  leads: ReadonlyArray<AttachedLeadDto>;
}>;
