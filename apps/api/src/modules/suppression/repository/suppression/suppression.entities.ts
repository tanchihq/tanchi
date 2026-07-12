type ExclusionScope = "person" | "company";

type PgExclusionEntry = Readonly<{
  id: string;
  scope: ExclusionScope;
  email: string | null;
  company_domain: string | null;
  reason: string | null;
  created_at: Date;
}>;

type PgDeletedExclusion = Readonly<{
  scope: ExclusionScope;
  email: string | null;
  company_domain: string | null;
}>;

export type { ExclusionScope, PgDeletedExclusion, PgExclusionEntry };
