import { type Stage } from '@/api/shared/enums';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatConversationSummaryDto = Readonly<{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ChatMessageDto = Readonly<{
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}>;

export type ChatLeadDto = Readonly<{
  leadId: string;
  name: string;
  company: string;
  stage: Stage;
}>;

export type ChatConversationDto = Readonly<{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ReadonlyArray<ChatMessageDto>;
  leads: ReadonlyArray<ChatLeadDto>;
}>;

export type ChatStreamUserEvent = Readonly<{
  message: ChatMessageDto;
  title: string;
}>;

export type ChatStreamDeltaEvent = Readonly<{
  text: string;
}>;

export type ChatStreamDoneEvent = Readonly<{
  message: ChatMessageDto;
  title: string;
}>;

export type ChatStreamErrorEvent = Readonly<{
  error: string;
}>;
