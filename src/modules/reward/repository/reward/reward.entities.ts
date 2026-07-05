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
}>;

type RecordReplyInput = Readonly<{
  organizationId: string;
  leadId: string;
  messageId: string;
  classification: "positive" | "negative" | "later" | "neutral";
  replyText: string;
  stage: string;
}>;

export type { PgRewardLead, PgRewardSender, RecordReplyInput };
