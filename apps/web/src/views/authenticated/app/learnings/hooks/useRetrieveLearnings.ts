import { useAsync } from '@/hooks/useAsync';
import { getLearningsAxios } from '@/api/api';

const useRetrieveLearnings = () => useAsync({ promise: () => getLearningsAxios() });

export default useRetrieveLearnings;
