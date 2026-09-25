import { type QueueSkipReason } from './response.entities';

export type SkipQueueItemDto = Readonly<{
  reason: QueueSkipReason | null;
}>;
