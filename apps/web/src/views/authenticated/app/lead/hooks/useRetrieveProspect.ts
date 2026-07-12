import { useAsync } from '@/hooks/useAsync';
import { getOneProspectAxios } from '@/api/api';

type UseRetrieveProspectProps = Readonly<{ id: string }>;

const useRetrieveProspect = ({ id }: UseRetrieveProspectProps) =>
  useAsync({ promise: () => getOneProspectAxios(id) });

export default useRetrieveProspect;
