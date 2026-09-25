import { useAsync } from '@/hooks/useAsync';
import { getQueueAxios } from '@/api/api';
import { type QueueDto } from '@/api/queue/entities/response.entities';

type UseRetrieveQueueProps = Readonly<{ onLoaded: (queue: QueueDto) => void }>;

const useRetrieveQueue = ({ onLoaded }: UseRetrieveQueueProps) =>
  useAsync({
    promise: () => getQueueAxios(),
    onSuccess: ({ returnedData }) => onLoaded(returnedData),
  });

export default useRetrieveQueue;
