import { useAsync } from '@/hooks/useAsync';
import { getManyProspectAxios } from '@/api/api';

const useRetrieveProspects = () => useAsync({ promise: () => getManyProspectAxios() });

export default useRetrieveProspects;
