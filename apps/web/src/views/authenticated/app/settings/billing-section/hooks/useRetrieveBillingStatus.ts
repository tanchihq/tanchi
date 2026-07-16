import { useAsync } from '@/hooks/useAsync';
import { getBillingStatusAxios } from '@/api/api';

const useRetrieveBillingStatus = () =>
  useAsync({
    promise: () => getBillingStatusAxios(),
  });

export default useRetrieveBillingStatus;
