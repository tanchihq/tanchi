import { type ExclusionScope } from '@/api/shared/enums';
import { type SuppressionEntryDto } from '@/api/suppression/entities/response.entities';

export type ScopeFilter = 'all' | ExclusionScope;

export const SCOPE_FILTERS: ReadonlyArray<{ value: ScopeFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'person', label: 'People' },
  { value: 'company', label: 'Companies' },
];

export const dayLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const matchesScope = (
  entry: SuppressionEntryDto,
  filter: ScopeFilter,
): boolean => filter === 'all' || entry.scope === filter;

export const entryLabel = (entry: SuppressionEntryDto): string =>
  entry.scope === 'company'
    ? entry.companyDomain ?? 'Unknown company'
    : entry.email ?? 'Unknown address';
