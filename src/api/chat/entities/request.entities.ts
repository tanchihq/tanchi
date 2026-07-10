export type CreateConversationDto = Readonly<{
  title?: string;
}>;

export type SendChatMessageDto = Readonly<{
  content: string;
}>;

export type AttachLeadDto = Readonly<{
  leadId: string;
}>;
