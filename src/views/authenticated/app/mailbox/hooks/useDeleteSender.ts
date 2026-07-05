import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { deleteOneSenderAxios } from '@/api/api';

type UseDeleteSenderProps = Readonly<{ onDone: () => void }>;

const useDeleteSender = ({ onDone }: UseDeleteSenderProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't delete the mailbox."),
    onSuccess: () => onDone(),
    promise: (id: string) => deleteOneSenderAxios(id),
  });

export default useDeleteSender;
