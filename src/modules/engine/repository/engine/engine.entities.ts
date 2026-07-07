type PgEngineIcp = Readonly<{
  id: string;
  name: string;
  archetype: string | null;
  description: string;
  perceived_value: string | null;
  angle: string | null;
  golden_rule: string | null;
}>;

type PgEngineProfile = Readonly<{
  website: string;
  product_page_url: string | null;
  sales_deck_url: string | null;
  outreach_language: string;
  company_profile: string;
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

export type {
  CreateCompanyInput,
  CreateLeadInput,
  CreateMessageDraftInput,
  PersistProfileInput,
  PgCopyAngle,
  PgCopyFact,
  PgEngineIcp,
  PgEngineLead,
  PgEngineProfile,
  PgEngineRun,
  ProfileAngleInput,
  ProfileFactInput,
};
