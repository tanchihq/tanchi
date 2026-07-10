import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { getConversationAxios } from '@/api/api';
import { type ChatConversationDto } from '@/api/chat/entities/response.entities';

type UseRefreshConversationProps = Readonly<{
  onRefreshed: (conversation: ChatConversationDto) => void;
}>;

const useRefreshConversation = ({ onRefreshed }: UseRefreshConversationProps) =>
  useAsyncEvent({
    onSuccess: ({ returnedData }) => onRefreshed(returnedData),
    promise: (id: string) => getConversationAxios(id),
  });

export default useRefreshConversation;
