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

type CreateManualLeadInput = Readonly<{
  organizationId: string;
  companyName: string;
  companyDomain: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  email: string | null;
  linkedinUrl: string | null;
  icpId: string | null;
}>;

type PgIcpOption = Readonly<{
  id: string;
  name: string;
}>;

type PgCreatedLead = Readonly<{
  lead_id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}>;

type PgLeadDetail = Readonly<{
  id: string;
  icp_id: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  email: string | null;
  company_name: string | null;
  company_domain: string | null;
  company_sector: string | null;
  company_size: string | null;
  summary: string | null;
  draft_subject: string | null;
  draft_body: string | null;
}>;

type PgLeadFact = Readonly<{
  text: string;
  source_url: string;
}>;

type SaveDraftInput = Readonly<{
  organizationId: string;
  leadId: string;
  icpId: string | null;
  subject: string | null;
  body: string;
  angleTypeInferred: string | null;
  lengthBucket: string | null;
}>;

type RecordSentMessageInput = Readonly<{
  organizationId: string;
  leadId: string;
  icpId: string | null;
  subject: string | null;
  body: string;
  sentAt: Date;
}>;

type UpdateLeadInput = Readonly<{
  organizationId: string;
  leadId: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  email: string | null;
  emailStatus: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  channel: string | null;
}>;

export type {
  ChatRole,
  CreateManualLeadInput,
  InsertMessageInput,
  PgAttachedLead,
  PgChatMessage,
  PgConversation,
  PgCreatedLead,
  PgIcpOption,
  PgLeadContext,
  PgLeadDetail,
  PgLeadFact,
  RecordSentMessageInput,
  SaveDraftInput,
  UpdateLeadInput,
};
