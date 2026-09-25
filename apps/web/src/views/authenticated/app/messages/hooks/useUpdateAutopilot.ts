import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { updateAutopilotAxios } from '@/api/api';
import { AutopilotErrors } from '@/api/autopilot/entities/errors';
import { type AutopilotDto } from '@/api/autopilot/entities/response.entities';

type UseUpdateAutopilotProps = Readonly<{
  onUpdated: (autopilot: AutopilotDto) => void;
}>;

const useUpdateAutopilot = ({ onUpdated }: UseUpdateAutopilotProps) =>
  useAsyncEvent({
    onError: ({ error }) =>
      toast.error(
        error.message === AutopilotErrors.notOnboarded
          ? 'Finish onboarding before turning on autopilot.'
          : "Couldn't change the mode, please try again.",
      ),
    onSuccess: ({ returnedData }) => {
      onUpdated(returnedData);
      toast.success(
        returnedData.enabled
          ? 'Autopilot on. Emails go out on their own during business hours.'
          : 'Review mode. Nothing goes out without your validation.',
      );
    },
    promise: (enabled: boolean) => updateAutopilotAxios({ enabled }),
  });

export default useUpdateAutopilot;
