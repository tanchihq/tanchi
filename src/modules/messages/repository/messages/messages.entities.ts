type PgMessageHistoryRow = Readonly<{
  id: string;
  lead_id: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  sent_at: Date | null;
  created_at: Date;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  reply_classification: string | null;
}>;

type GetMessagesFilter = Readonly<{
  organizationId: string;
  status?: string;
  leadId?: string;
  limit: number;
}>;

type PgEditableMessage = Readonly<{
  id: string;
  organization_id: string;
  subject: string | null;
  body: string;
  status: string;
}>;

type SaveMessageEditInput = Readonly<{
  organizationId: string;
  messageId: string;
  aiVersion: string;
  subject: string | null;
  body: string;
}>;

export type {
  GetMessagesFilter,
  PgEditableMessage,
  PgMessageHistoryRow,
  SaveMessageEditInput,
};
