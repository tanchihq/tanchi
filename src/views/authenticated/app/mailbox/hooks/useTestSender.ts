import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { testOneSenderAxios } from '@/api/api';

type UseTestSenderProps = Readonly<{ onDone: () => void }>;

const useTestSender = ({ onDone }: UseTestSenderProps) =>
  useAsyncEvent({
    onError: () => toast.error('Connection test failed. Check host, port and password.'),
    onSuccess: () => {
      onDone();
      toast.success('Mailbox verified.');
    },
    promise: (id: string) => testOneSenderAxios(id),
  });

export default useTestSender;
