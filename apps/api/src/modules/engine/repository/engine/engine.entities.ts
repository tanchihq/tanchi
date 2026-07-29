type PgEngineIcp = Readonly<{
  id: string;
  market_id: string;
  name: string;
  archetype: string | null;
  description: string;
  perceived_value: string | null;
  angle: string | null;
  golden_rule: string | null;
  country: string;
  outreach_language: string;
  company_profile: string;
  leads_per_day: number;
}>;

type PgEngineProfile = Readonly<{
  website: string;
  product_page_url: string | null;
  sales_deck_url: string | null;
}>;

type PgEngineRun = Readonly<{
  id: string;
  organization_id: string;
  status: string;
  sourced: boolean;
  sourced_count: number;
  profiled_count: number;
  drafted_count: number;
}>;

type PgEngineLead = Readonly<{
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
  channel: string;
  icp_id: string | null;
  company_name: string | null;
  company_domain: string | null;
  company_website: string | null;
  company_sector: string | null;
  company_size: string | null;
  company_hq: string | null;
  icp_name: string | null;
  icp_archetype: string | null;
  icp_description: string | null;
  icp_perceived_value: string | null;
  icp_angle: string | null;
  icp_golden_rule: string | null;
  country: string;
  outreach_language: string;
  company_profile: string;
}>;

type CreateCompanyInput = Readonly<{
  organizationId: string;
  name: string;
  domain: string | null;
  website: string | null;
  sector: string | null;
  size: string | null;
  hq: string | null;
}>;

type CreateLeadInput = Readonly<{
  organizationId: string;
  companyId: string;
  icpId: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  email: string | null;
  emailStatus: "verified" | "guessed" | "none";
  linkedinUrl: string | null;
  instagramUrl: string | null;
  phone: string | null;
  channel: string;
  sourceProvider: string;
}>;

type ProfileFactInput = Readonly<{
  text: string;
  sourceUrl: string;
  evidence: string;
  provenance: "own_source" | "third_party";
}>;

type ProfileAngleInput = Readonly<{
  rank: number;
  title: string;
  note: string;
  angleType: string;
  factIndex: number;
  chosen: boolean;
}>;

type PersistProfileInput = Readonly<{
  organizationId: string;
  leadId: string;
  summary: string;
  qualification: "A" | "B" | "C";
  score: number;
  channel: string;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  facts: ReadonlyArray<ProfileFactInput>;
  angles: ReadonlyArray<ProfileAngleInput>;
}>;

type PgCopyFact = Readonly<{
  text: string;
  source_url: string;
}>;

type PgCopyAngle = Readonly<{
  title: string;
  note: string | null;
  angle_type: string | null;
}>;

type CreateMessageDraftInput = Readonly<{
  organizationId: string;
  leadId: string;
  icpId: string | null;
  channel: string;
  subject: string | null;
  body: string;
  angleType: string | null;
  angleTypeInferred: string | null;
  lengthBucket: string | null;
  ctaType: string | null;
  persoDepth: string | null;
  slot: string | null;
  isExploration: boolean;
}>;

type PgMessageOutcomeRow = Readonly<{
  angle_type: string | null;
  angle_type_inferred: string | null;
  length_bucket: string | null;
  cta_type: string | null;
  perso_depth: string | null;
  channel: string;
  subject: string | null;
  body: string;
  positive: boolean;
  replied: boolean;
}>;

type PgIcpEdit = Readonly<{
  ai_version: string;
  edited_version: string;
  angle_type: string | null;
}>;

type PgProfileConversionRow = Readonly<{
  sector: string | null;
  size: string | null;
  hq: string | null;
  role: string | null;
  qualification: string | null;
  positive: boolean;
  replied: boolean;
}>;

export type {
  CreateCompanyInput,
  CreateLeadInput,
  CreateMessageDraftInput,
  PersistProfileInput,
  PgCopyAngle,
  PgCopyFact,
  PgEngineIcp,
  PgEngineLead,
  PgIcpEdit,
  PgMessageOutcomeRow,
  PgProfileConversionRow,
  PgEngineProfile,
  PgEngineRun,
  ProfileAngleInput,
  ProfileFactInput,
};
