import { type QueueItemDto } from '@/api/queue/entities/response.entities';
import { CHANNEL_META } from '@/utils/prospect-display';

export const identityLine = (item: QueueItemDto): string =>
  [item.role, item.company]
    .filter((part): part is string => part !== null && part !== '')
    .join(' · ');

export const scoreLabel = (item: QueueItemDto): string | null => {
  if (item.qualification !== null && item.score !== null) {
    return `${item.qualification} · ${item.score}`;
  }
  if (item.score !== null) return `Score ${item.score}`;
  return item.qualification;
};

export const recipientLine = (item: QueueItemDto): string => {
  if (item.channel === 'email' && item.email !== null)
    return `To ${item.email}`;
  return `${CHANNEL_META[item.channel].label} · you send it yourself`;
};
