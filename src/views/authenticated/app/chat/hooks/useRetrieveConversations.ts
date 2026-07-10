import { useAsync } from '@/hooks/useAsync';
import { getConversationsAxios } from '@/api/api';

const useRetrieveConversations = () =>
  useAsync({ promise: () => getConversationsAxios() });

export default useRetrieveConversations;
