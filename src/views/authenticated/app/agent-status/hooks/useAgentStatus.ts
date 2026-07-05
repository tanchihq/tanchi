import { useEffect } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { getActivityStatusAxios } from '@/api/api';

const RUNNING_POLL_MS = 4000;
const IDLE_POLL_MS = 45000;

const useAgentStatus = () => {
  const { data, refetch } = useAsync({ promise: () => getActivityStatusAxios() });

  useEffect(() => {
    const delay = data?.isRunning === true ? RUNNING_POLL_MS : IDLE_POLL_MS;
    const timer = setInterval(refetch, delay);
    return () => clearInterval(timer);
  }, [data?.isRunning]);

  return data ?? null;
};

export default useAgentStatus;
