type PgQueueChannel =
  | "email"
  | "linkedin"
  | "whatsapp"
  | "instagram"
  | "sms"
  | "call";

type PgQueueSkipReason =
  | "wrong_lead"
  | "wrong_angle"
  | "too_generic"
  | "not_now";

type PgQueueRow = Readonly<{
  message_id: string;
  lead_id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  channel: PgQueueChannel;
  hot: boolean;
  status: string;
  subject: string | null;
  body: string;
  angle_type: string | null;
  message_created_at: Date;
  company_name: string | null;
  email: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  score: number | null;
  qualification: string | null;
  sequence_step: number;
  previous_subject: string | null;
  previous_body: string | null;
  previous_sent_at: Date | null;
  angle_title: string | null;
  angle_note: string | null;
  angle_fact_text: string | null;
  angle_fact_source_url: string | null;
}>;

type PgQueueSenderCred = Readonly<{
  id: string;
  from_name: string;
  from_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  username: string;
  secret_encrypted: string;
  signature: string;
}>;

type MarkSentAndAdvanceInput = Readonly<{
  organizationId: string;
  messageId: string;
  leadId: string;
  senderId: string | null;
  emailMessageId: string | null;
}>;

type PgQueueFact = Readonly<{
  lead_id: string;
  text: string;
  source_url: string;
}>;

type ApplyEditInput = Readonly<{
  organizationId: string;
  messageId: string;
  aiVersion: string;
  editedVersion: string;
  subject?: string | null;
}>;

type SkipDraftInput = Readonly<{
  organizationId: string;
  messageId: string;
  leadId: string;
  email: string | null;
  reason: PgQueueSkipReason | null;
}>;

export type {
  ApplyEditInput,
  MarkSentAndAdvanceInput,
  PgQueueChannel,
  PgQueueFact,
  PgQueueRow,
  PgQueueSenderCred,
  PgQueueSkipReason,
  SkipDraftInput,
};
