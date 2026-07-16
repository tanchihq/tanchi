import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { authClient } from '@/api/auth-client';

type UseRestoreSubscriptionProps = Readonly<{
  onRestored: () => void;
}>;

const restoreSubscription = async (organizationId: string): Promise<void> => {
  const { error } = await authClient.subscription.restore({
    referenceId: organizationId,
  });
  if (error) {
    throw new Error(error.message ?? 'restoreFailed');
  }
};

const useRestoreSubscription = ({ onRestored }: UseRestoreSubscriptionProps) =>
  useAsyncEvent({
    onError: () => {
      toast.error('Could not resume the subscription, please try again.');
    },
    onSuccess: () => {
      toast.success('Subscription resumed.');
      onRestored();
    },
    promise: (organizationId: string) => restoreSubscription(organizationId),
  });

export default useRestoreSubscription;
