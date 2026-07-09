import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { deleteSuppressionAxios } from '@/api/api';
import { SuppressionErrors } from '@/api/suppression/entities/errors';

type UseReinstateExclusionProps = Readonly<{ onReinstated: () => void }>;

const useReinstateExclusion = ({ onReinstated }: UseReinstateExclusionProps) =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case SuppressionErrors.inexistingExclusion:
          toast.error('This exclusion no longer exists.');
          break;
        default:
          toast.error("Couldn't reinstate, please try again.");
      }
    },
    onSuccess: () => {
      onReinstated();
      toast.success('Reinstated. It is eligible again and reappears in the pipeline.');
    },
    promise: (id: string) => deleteSuppressionAxios(id),
  });

export default useReinstateExclusion;
