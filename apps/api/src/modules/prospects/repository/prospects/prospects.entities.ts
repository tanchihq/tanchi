type PgChannel =
  | "email"
  | "linkedin"
  | "whatsapp"
  | "instagram"
  | "sms"
  | "call";

type PgStage =
  | "identified"
  | "contacted"
  | "following-up"
  | "replied"
  | "meeting"
  | "won"
  | "not-interested"
  | "snoozed";

type PgOrigin = "auto" | "manual";

type PgEmailStatus = "verified" | "guessed" | "none";

type PgLeadListRow = Readonly<{
  id: string;
  first_name: string | null;
  last_name: string | null;
  channel: PgChannel;
  hot: boolean;
  stage: PgStage;
  origin: PgOrigin;
  score: number | null;
  qualification: string | null;
  created_at: Date;
  next_follow_up_at: Date | null;
  snooze_until: Date | null;
  company_name: string | null;
  icp_name: string | null;
  market_id: string | null;
  market_name: string | null;
}>;

type PgLeadRow = Readonly<{
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  channel: PgChannel;
  hot: boolean;
  stage: PgStage;
  origin: PgOrigin;
  email: string | null;
  email_status: PgEmailStatus;
  phone: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  score: number | null;
  qualification: string | null;
  created_at: Date;
  next_follow_up_at: Date | null;
  snooze_until: Date | null;
  company_id: string | null;
  company_name: string | null;
  company_sector: string | null;
  company_size: string | null;
  company_hq: string | null;
  company_website: string | null;
  company_domain: string | null;
  icp_name: string | null;
  market_id: string | null;
  market_name: string | null;
}>;

type PgProspectDossier = Readonly<{
  id: string;
  summary: string | null;
}>;

type PgProspectFact = Readonly<{
  text: string;
  source_url: string;
}>;

type PgProspectAngle = Readonly<{
  rank: number;
  title: string;
  note: string | null;
  angle_type: string | null;
  chosen: boolean;
}>;

type PgProspectMessage = Readonly<{
  id: string;
  channel: PgChannel;
  subject: string | null;
  body: string;
  status: string;
  sent_at: Date | null;
  created_at: Date;
}>;

type PgProspectOutcome = Readonly<{
  stage_signal: string;
  classification: string | null;
  reply_text: string | null;
  created_at: Date;
}>;

type PgSenderCred = Readonly<{
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

type PgDraftMessage = Readonly<{
  id: string;
  subject: string | null;
  body: string;
}>;

type ExcludeProspectInput = Readonly<{
  organizationId: string;
  leadId: string;
  companyId: string | null;
  scope: "person" | "company";
  email: string | null;
  companyDomain: string | null;
  reason: string | null;
}>;

export type {
  ExcludeProspectInput,
  PgChannel,
  PgDraftMessage,
  PgEmailStatus,
  PgLeadListRow,
  PgLeadRow,
  PgOrigin,
  PgProspectAngle,
  PgProspectDossier,
  PgProspectFact,
  PgProspectMessage,
  PgProspectOutcome,
  PgSenderCred,
  PgStage,
};
