import { useAsync } from '@/hooks/useAsync';
import { getManySenderAxios } from '@/api/api';

const useLeadSenders = () => useAsync({ promise: () => getManySenderAxios() });

export default useLeadSenders;
