type PgSequenceConfig = Readonly<{
  follow_up_intervals: ReadonlyArray<number>;
  excluded_weekdays: ReadonlyArray<number>;
  website: string;
  company_profile: string;
  outreach_language: string;
  company_name: string;
}>;

type PgDueLead = Readonly<{
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  channel: string;
  icp_id: string | null;
  sequence_step: number;
  company_name: string | null;
  last_sent_at: Date | null;
}>;

type PgSequenceFact = Readonly<{
  text: string;
  source_url: string;
}>;

type CreateFollowUpDraftInput = Readonly<{
  organizationId: string;
  leadId: string;
  icpId: string | null;
  channel: string;
  subject: string | null;
  body: string;
  lengthBucket: string;
}>;

export type {
  CreateFollowUpDraftInput,
  PgDueLead,
  PgSequenceConfig,
  PgSequenceFact,
};
