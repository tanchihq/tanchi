import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { validateQueueItemAxios } from '@/api/api';
import { type QueueItemDto } from '@/api/queue/entities/response.entities';
import { isEmailItem, sendErrorMessage } from '../utils';

type UseValidateQueueItemProps = Readonly<{
  onSent: () => void;
  onFailed: (item: QueueItemDto) => void;
}>;

const useValidateQueueItem = ({
  onSent,
  onFailed,
}: UseValidateQueueItemProps) =>
  useAsyncEvent({
    onError: ({ error, data }) => {
      toast.error(sendErrorMessage(error.message));
      onFailed(data);
    },
    onSuccess: ({ data }) => {
      toast.success(
        isEmailItem(data) && data.email !== null
          ? `Email sent to ${data.email}`
          : 'Marked as sent',
      );
      onSent();
    },
    promise: (item: QueueItemDto) => validateQueueItemAxios(item.id),
  });

export default useValidateQueueItem;
