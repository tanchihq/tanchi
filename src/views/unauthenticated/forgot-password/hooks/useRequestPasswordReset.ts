import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { authClient } from '@/api/auth-client';
import { PasswordResetErrors } from '@/api/auth/entities/errors';
import { appUrl } from '@/utils/url';

const useRequestPasswordReset = () =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case PasswordResetErrors.rateLimited:
          toast.error('Please wait a moment before trying again.');
          break;
        default:
          toast.error('Something went wrong, please try again later.');
      }
    },
    promise: async (email: string) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: appUrl('/reset-password'),
      });
      if (error) {
        throw new Error(
          error.status === 429
            ? PasswordResetErrors.rateLimited
            : PasswordResetErrors.requestFailed,
        );
      }
    },
  });

export { useRequestPasswordReset };
export default useRequestPasswordReset;
