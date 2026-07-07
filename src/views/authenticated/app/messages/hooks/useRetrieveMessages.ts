import { useAsync } from '@/hooks/useAsync';
import { getMessagesAxios } from '@/api/api';

const useRetrieveMessages = () => useAsync({ promise: () => getMessagesAxios() });

export default useRetrieveMessages;
