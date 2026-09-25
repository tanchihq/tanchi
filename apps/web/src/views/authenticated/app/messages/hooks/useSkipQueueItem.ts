import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { skipQueueItemAxios } from '@/api/api';
import {
  type QueueItemDto,
  type QueueSkipReason,
} from '@/api/queue/entities/response.entities';
import { skipOutcomeMessage } from '../utils';

type SkipPayload = Readonly<{
  item: QueueItemDto;
  reason: QueueSkipReason | null;
}>;

type UseSkipQueueItemProps = Readonly<{
  onSkipped: () => void;
  onFailed: (item: QueueItemDto) => void;
}>;

const useSkipQueueItem = ({ onSkipped, onFailed }: UseSkipQueueItemProps) =>
  useAsyncEvent({
    onError: ({ data }) => {
      toast.error("Couldn't skip this draft. It is back in your queue.");
      onFailed(data.item);
    },
    onSuccess: ({ data, returnedData }) => {
      if (data.reason !== null)
        toast.success(skipOutcomeMessage(returnedData.nextStep));
      onSkipped();
    },
    promise: ({ item, reason }: SkipPayload) =>
      skipQueueItemAxios(item.id, { reason }),
  });

export default useSkipQueueItem;
