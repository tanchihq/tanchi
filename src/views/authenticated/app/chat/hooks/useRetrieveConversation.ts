import { useAsync } from '@/hooks/useAsync';
import { getConversationAxios } from '@/api/api';

type UseRetrieveConversationProps = Readonly<{ id: string }>;

const useRetrieveConversation = ({ id }: UseRetrieveConversationProps) =>
  useAsync({ promise: () => getConversationAxios(id) });

export default useRetrieveConversation;
