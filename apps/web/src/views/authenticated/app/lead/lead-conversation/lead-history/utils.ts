import { type LeadHistoryEntryDto } from '@/api/prospects/entities/response.entities';

export const historyEntryKey = (
  entry: LeadHistoryEntryDto,
  index: number,
): string => `${entry.kind}-${index}-${entry.at}`;

export const lastSentKey = (
  entries: ReadonlyArray<LeadHistoryEntryDto>,
): string | null => {
  const lastSentIndex = entries.reduce(
    (found, entry, index) => (entry.kind === 'sent' ? index : found),
    -1,
  );
  const entry = entries[lastSentIndex];
  return entry === undefined ? null : historyEntryKey(entry, lastSentIndex);
};

export const entryLabel = (
  entry: LeadHistoryEntryDto,
  contactName: string,
): string => (entry.kind === 'sent' ? 'You sent' : `${contactName} replied`);

export const previewOf = (body: string): string => {
  const flattened = body.replace(/\s+/g, ' ').trim();
  return flattened.length <= 90 ? flattened : `${flattened.slice(0, 90)}…`;
};

export const withoutLastReply = (
  entries: ReadonlyArray<LeadHistoryEntryDto>,
): ReadonlyArray<LeadHistoryEntryDto> => {
  const lastReplyIndex = entries.reduce(
    (found, entry, index) => (entry.kind === 'reply' ? index : found),
    -1,
  );
  return lastReplyIndex === -1
    ? entries
    : entries.filter((_, index) => index !== lastReplyIndex);
};
