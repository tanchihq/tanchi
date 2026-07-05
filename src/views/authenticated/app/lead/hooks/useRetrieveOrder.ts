import { useAsync } from '@/hooks/useAsync';
import { getManyProspectAxios } from '@/api/api';

const useRetrieveOrder = () => useAsync({ promise: () => getManyProspectAxios() });

export default useRetrieveOrder;
