import { type Stage } from '@/api/shared/enums';
import { type ProspectDto } from '@/api/prospects/entities/response.entities';

const STORAGE_PREFIX = 'pipeline.section.';

export const readSectionExpanded = (stage: Stage): boolean =>
  localStorage.getItem(`${STORAGE_PREFIX}${stage}`) === '1';

export const writeSectionExpanded = (stage: Stage, expanded: boolean): void =>
  localStorage.setItem(`${STORAGE_PREFIX}${stage}`, expanded ? '1' : '0');

export const matchesQuery = (prospect: ProspectDto, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  return (
    `${prospect.firstName} ${prospect.lastName}`.toLowerCase().includes(needle) ||
    prospect.company.toLowerCase().includes(needle) ||
    prospect.icp.toLowerCase().includes(needle)
  );
};

export const isSnoozeExpired = (snoozeUntil: string | null): boolean =>
  snoozeUntil !== null && new Date(snoozeUntil).getTime() <= Date.now();

const snoozeTime = (prospect: ProspectDto): number =>
  prospect.snoozeUntil === null
    ? Number.POSITIVE_INFINITY
    : new Date(prospect.snoozeUntil).getTime();

export const bySnoozeAsc = (a: ProspectDto, b: ProspectDto): number =>
  snoozeTime(a) - snoozeTime(b);

export const byCreatedDesc = (a: ProspectDto, b: ProspectDto): number =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export const wakeLabel = (snoozeUntil: string | null): string | null => {
  if (snoozeUntil === null) return null;
  return new Date(snoozeUntil).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};
