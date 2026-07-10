type ChatRole = "user" | "assistant";

type PgConversation = Readonly<{
  id: string;
  organization_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}>;

type PgChatMessage = Readonly<{
  id: string;
  role: ChatRole;
  content: string;
  created_at: Date;
}>;

type PgAttachedLead = Readonly<{
  lead_id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  stage: string;
}>;

type PgLeadContext = Readonly<{
  lead_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  company_name: string | null;
  company_sector: string | null;
  company_size: string | null;
  summary: string | null;
  draft_subject: string | null;
  draft_body: string | null;
}>;

type InsertMessageInput = Readonly<{
  organizationId: string;
  conversationId: string;
  role: ChatRole;
  content: string;
}>;

export type {
  ChatRole,
  InsertMessageInput,
  PgAttachedLead,
  PgChatMessage,
  PgConversation,
  PgLeadContext,
};
