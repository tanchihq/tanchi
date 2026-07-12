import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { deleteConversationAxios } from '@/api/api';

type UseDeleteConversationProps = Readonly<{ onDeleted: (id: string) => void }>;

const useDeleteConversation = ({ onDeleted }: UseDeleteConversationProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't delete the conversation."),
    onSuccess: ({ data }) => onDeleted(data),
    promise: (id: string) => deleteConversationAxios(id),
  });

export default useDeleteConversation;
