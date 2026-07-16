import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { authClient } from '@/api/auth-client';

const startCancellation = async (organizationId: string): Promise<void> => {
  const { error } = await authClient.subscription.cancel({
    referenceId: organizationId,
    returnUrl: window.location.href,
  });
  if (error) {
    throw new Error(error.message ?? 'cancelFailed');
  }
};

const useCancelSubscription = () =>
  useAsyncEvent({
    onError: () => {
      toast.error('Could not open the billing portal, please try again.');
    },
    promise: (organizationId: string) => startCancellation(organizationId),
  });

export default useCancelSubscription;
