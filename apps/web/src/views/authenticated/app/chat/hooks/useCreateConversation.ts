import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { createConversationAxios } from '@/api/api';
import { type ChatConversationSummaryDto } from '@/api/chat/entities/response.entities';

type UseCreateConversationProps = Readonly<{
  onCreated: (conversation: ChatConversationSummaryDto) => void;
}>;

const useCreateConversation = ({ onCreated }: UseCreateConversationProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't start a conversation, please try again."),
    onSuccess: ({ returnedData }) => onCreated(returnedData),
    promise: () => createConversationAxios(),
  });

export default useCreateConversation;
