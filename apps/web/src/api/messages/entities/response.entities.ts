import { type Channel } from '@/api/shared/enums';

export type MessageStatus = 'draft' | 'edited' | 'sent' | 'skipped';

export type MessageHistoryDto = Readonly<{
  id: string;
  leadId: string;
  prospectName: string;
  company: string;
  channel: Channel;
  subject: string | null;
  body: string;
  status: MessageStatus;
  sentAt: string | null;
  replyClassification: string | null;
  createdAt: string;
}>;

export type EditMessageResultDto = Readonly<{
  id: string;
  subject: string | null;
  body: string;
  status: MessageStatus;
}>;
