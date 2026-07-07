import { useAsync } from '@/hooks/useAsync';
import { getSuppressionAxios } from '@/api/api';

const useRetrieveSuppression = () => useAsync({ promise: () => getSuppressionAxios() });

export default useRetrieveSuppression;
