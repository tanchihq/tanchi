import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { authClient } from '@/api/auth-client';
import { VerificationErrors } from '@/api/auth/entities/errors';
import { appUrl } from '@/utils/url';

const useResendVerificationEmail = () =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case VerificationErrors.rateLimited:
          toast.error('Please wait a moment before requesting another email.');
          break;
        default:
          toast.error('Could not send the email, please try again later.');
      }
    },
    onSuccess: () => toast.success('Verification email sent.'),
    promise: async (email: string) => {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: appUrl('/'),
      });
      if (error) {
        throw new Error(
          error.status === 429
            ? VerificationErrors.rateLimited
            : VerificationErrors.sendFailed,
        );
      }
    },
  });

export { useResendVerificationEmail };
export default useResendVerificationEmail;
