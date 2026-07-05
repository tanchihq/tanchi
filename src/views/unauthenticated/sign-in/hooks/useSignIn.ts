import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { authClient } from '@/api/auth-client';
import {
  BETTER_AUTH_INVALID_CREDENTIALS_CODES,
  SignInErrors,
} from '@/api/auth/entities/errors';
import { type SignInDto } from '@/api/auth/entities/request.entities';
import { useAuth } from '@/store/context/auth.context';

const useSignIn = () => {
  const { refreshSession } = useAuth();

  return useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case SignInErrors.invalidCredentials:
          toast.error('Incorrect email or password.');
          break;
        default:
          toast.error('Something went wrong, please try again later.');
      }
    },
    onSuccess: () => {
      refreshSession();
      toast.success('Signed in.');
    },
    promise: async (data: SignInDto) => {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (error) {
        throw new Error(
          error.code !== undefined &&
          BETTER_AUTH_INVALID_CREDENTIALS_CODES.includes(error.code)
            ? SignInErrors.invalidCredentials
            : SignInErrors.signInFailed,
        );
      }
    },
  });
};

export { useSignIn };
