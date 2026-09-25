import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { editQueueItemAxios } from '@/api/api';
import { type QueueItemDto } from '@/api/queue/entities/response.entities';

type EditPayload = Readonly<{
  id: string;
  message: string;
  subject?: string | null;
}>;

type UseEditQueueItemProps = Readonly<{
  onSaved: (item: QueueItemDto) => void;
}>;

const useEditQueueItem = ({ onSaved }: UseEditQueueItemProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't save the draft, please try again."),
    onSuccess: ({ returnedData }) => {
      onSaved(returnedData);
      toast.success('Draft saved. Your edits teach the AI what works.');
    },
    promise: (payload: EditPayload) => editQueueItemAxios(payload),
  });

export default useEditQueueItem;
