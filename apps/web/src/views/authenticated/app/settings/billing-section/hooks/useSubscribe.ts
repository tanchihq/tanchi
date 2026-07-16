import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { authClient } from '@/api/auth-client';

const startCheckout = async (organizationId: string): Promise<void> => {
  const { error } = await authClient.subscription.upgrade({
    plan: 'solo',
    referenceId: organizationId,
    successUrl: window.location.href,
    cancelUrl: window.location.href,
  });
  if (error) {
    throw new Error(error.message ?? 'checkoutFailed');
  }
};

const useSubscribe = () =>
  useAsyncEvent({
    onError: () => {
      toast.error('Could not start the checkout, please try again.');
    },
    promise: (organizationId: string) => startCheckout(organizationId),
  });

export default useSubscribe;
