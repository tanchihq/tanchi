export type ImportSuppressionResultDto = Readonly<{
  imported: number;
  totalFound: number;
}>;

export type SuppressionEntryDto = Readonly<{
  email: string;
  createdAt: string;
}>;

export type SuppressionListDto = ReadonlyArray<SuppressionEntryDto>;
