import { useAsync } from '@/hooks/useAsync';
import { getSuppressionAxios } from '@/api/api';

const useRetrieveExclusions = () => useAsync({ promise: () => getSuppressionAxios() });

export default useRetrieveExclusions;
