import { useAsync } from '@/hooks/useAsync';
import { getAutopilotAxios } from '@/api/api';
import { type AutopilotDto } from '@/api/autopilot/entities/response.entities';

type UseRetrieveAutopilotProps = Readonly<{
  onLoaded: (autopilot: AutopilotDto) => void;
}>;

const useRetrieveAutopilot = ({ onLoaded }: UseRetrieveAutopilotProps) =>
  useAsync({
    promise: () => getAutopilotAxios(),
    onSuccess: ({ returnedData }) => onLoaded(returnedData),
  });

export default useRetrieveAutopilot;
