type PgAutopilotSettings = Readonly<{
  autopilot_enabled: boolean;
  autopilot_updated_at: Date | null;
}>;

type PgAutopilotSender = Readonly<{
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
  daily_cap: number;
  sent_last_24h: number;
  last_sent_at: Date | null;
  sent_in_window: number;
  bounced_in_window: number;
}>;

type PgAutopilotCandidate = Readonly<{
  message_id: string;
  lead_id: string;
  subject: string | null;
  body: string;
  email: string;
  sequence_step: number;
  country: string;
  excluded_weekdays: ReadonlyArray<number>;
  previous_sender_id: string | null;
}>;

type MarkSentAutomaticallyInput = Readonly<{
  organizationId: string;
  messageId: string;
  leadId: string;
  senderId: string;
  emailMessageId: string;
}>;

export type {
  MarkSentAutomaticallyInput,
  PgAutopilotCandidate,
  PgAutopilotSender,
  PgAutopilotSettings,
};
