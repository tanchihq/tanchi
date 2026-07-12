import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { deleteProspectAxios } from '@/api/api';
import { ProspectErrors } from '@/api/prospects/entities/errors';
import { type ExcludeProspectDto } from '@/api/prospects/entities/request.entities';

type UseDeleteProspectProps = Readonly<{ onExcluded: () => void }>;

type DeleteProspectPayload = Readonly<{ id: string; dto: ExcludeProspectDto }>;

const useDeleteProspect = ({ onExcluded }: UseDeleteProspectProps) =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case ProspectErrors.invalidReason:
          toast.error('Reason is too long (500 characters max).');
          break;
        case ProspectErrors.inexistingProspect:
          toast.error('This prospect no longer exists.');
          break;
        case ProspectErrors.notInMyOrg:
          toast.error("You can't exclude this prospect.");
          break;
        default:
          toast.error("Couldn't exclude, please try again.");
      }
    },
    onSuccess: () => {
      onExcluded();
      toast.success('Excluded. Reinstate it any time from the Exclusions page.');
    },
    promise: ({ id, dto }: DeleteProspectPayload) => deleteProspectAxios(id, dto),
  });

export default useDeleteProspect;
