import { useAsync } from '@/hooks/useAsync';
import { getIntelligenceAxios } from '@/api/api';

const useRetrieveIntelligence = () =>
  useAsync({ promise: () => getIntelligenceAxios() });

export default useRetrieveIntelligence;
