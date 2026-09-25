type PgRewardSender = Readonly<{
  id: string;
  organization_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  username: string;
  secret_encrypted: string;
}>;

type PgRewardLead = Readonly<{
  id: string;
  stage: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}>;

type PgRewardThreadMatch = Readonly<{
  message_id: string;
  lead_id: string;
}>;

type PgRewardSentSubject = Readonly<{
  message_id: string;
  lead_id: string;
  subject: string;
}>;

type RecordReplyInput = Readonly<{
  organizationId: string;
  leadId: string;
  messageId: string;
  classification: "positive" | "negative" | "later" | "neutral";
  replyText: string;
  replyMessageId: string;
  replyFrom: string;
  stage: string;
}>;

type AdoptReplierInput = Readonly<{
  organizationId: string;
  leadId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}>;

type MarkLeadBouncedInput = Readonly<{
  organizationId: string;
  leadId: string;
  email: string;
  reason: string;
}>;

export type {
  AdoptReplierInput,
  MarkLeadBouncedInput,
  PgRewardLead,
  PgRewardSender,
  PgRewardSentSubject,
  PgRewardThreadMatch,
  RecordReplyInput,
};
