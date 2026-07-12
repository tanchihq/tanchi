import { useAsync } from '@/hooks/useAsync';
import { getManySenderAxios } from '@/api/api';

const useRetrieveSenders = () => useAsync({ promise: () => getManySenderAxios() });

export default useRetrieveSenders;
