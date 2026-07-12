export type MessageHistoryDto = Readonly<{
  id: string;
  leadId: string;
  prospectName: string;
  company: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  sentAt: string | null;
  replyClassification: string | null;
  createdAt: string;
}>;

export type MessageHistoryListDto = ReadonlyArray<MessageHistoryDto>;
