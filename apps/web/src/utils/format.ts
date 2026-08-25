const DAY_MS = 1000 * 60 * 60 * 24;

export const initialsOf = (firstName: string, lastName: string): string =>
  `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

export const fullName = (firstName: string, lastName: string): string =>
  `${firstName} ${lastName}`.trim();

export const relativeTime = (iso: string): string => {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const daysSince = (iso: string): number => {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / DAY_MS));
};

export const ageLabel = (createdAt: string): string => {
  const days = daysSince(createdAt);
  return days === 0 ? 'today' : `${days}d`;
};

export const followUpLabel = (iso: string | null): string | null => {
  if (iso === null) return null;
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round(diff / DAY_MS);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days}d`;
};

export const monthLabel = (iso: string | null): string | null => {
  if (iso === null) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short' });
};

export const isDueToday = (iso: string | null): boolean =>
  followUpLabel(iso) === 'today' || followUpLabel(iso) === 'overdue';

export const timelineDotColor = (kind: string): string => {
  if (kind === 'reply' || kind === 'positive' || kind === 'won') {
    return 'var(--app-success-fg)';
  }
  if (kind === 'sent' || kind === 'meeting') return 'var(--app-accent-fg)';
  return 'var(--app-faint)';
};
