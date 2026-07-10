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

export type ChatActionName =
  | 'create_lead'
  | 'fetch_context'
  | 'rewrite_draft'
  | 'assign_icp'
  | 'plan_follow_ups';

export type ChatStreamActionEvent = Readonly<{
  type: string;
  name: ChatActionName;
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
