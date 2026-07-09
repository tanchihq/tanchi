import { type ExclusionScope } from '@/api/shared/enums';

export type SuppressionEntryDto = Readonly<{
  id: string;
  scope: ExclusionScope;
  email: string | null;
  companyDomain: string | null;
  reason: string | null;
  createdAt: string;
}>;

export type ImportSuppressionResultDto = Readonly<{
  imported: number;
  totalFound: number;
}>;
