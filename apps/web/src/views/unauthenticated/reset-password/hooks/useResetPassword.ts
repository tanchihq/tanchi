import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { authClient } from '@/api/auth-client';
import { PasswordResetErrors } from '@/api/auth/entities/errors';

type ResetPasswordInput = Readonly<{ newPassword: string; token: string }>;

const useResetPassword = () => {
  const navigate = useNavigate();

  return useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case PasswordResetErrors.invalidToken:
          toast.error('This reset link is invalid or has expired.');
          break;
        case PasswordResetErrors.rateLimited:
          toast.error('Please wait a moment before trying again.');
          break;
        default:
          toast.error('Something went wrong, please try again later.');
      }
    },
    onSuccess: () => {
      toast.success('Password updated. You can sign in now.');
      navigate('/sign-in');
    },
    promise: async ({ newPassword, token }: ResetPasswordInput) => {
      const { error } = await authClient.resetPassword({ newPassword, token });
      if (error) {
        throw new Error(
          error.code === 'INVALID_TOKEN'
            ? PasswordResetErrors.invalidToken
            : error.status === 429
              ? PasswordResetErrors.rateLimited
              : PasswordResetErrors.resetFailed,
        );
      }
    },
  });
};

export { useResetPassword };
export default useResetPassword;
