export type ImportSuppressionResultDto = Readonly<{
  imported: number;
  totalFound: number;
}>;

export type ExclusionScopeDto = "person" | "company";

export type ExclusionEntryDto = Readonly<{
  id: string;
  scope: ExclusionScopeDto;
  email: string | null;
  companyDomain: string | null;
  reason: string | null;
  createdAt: string;
}>;

export type ExclusionListDto = ReadonlyArray<ExclusionEntryDto>;
