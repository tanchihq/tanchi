import { useAsync } from '@/hooks/useAsync';
import { getActivityAxios } from '@/api/api';

const useRetrieveActivity = () => useAsync({ promise: () => getActivityAxios(50) });

export default useRetrieveActivity;
