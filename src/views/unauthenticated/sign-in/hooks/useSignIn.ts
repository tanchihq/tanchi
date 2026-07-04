import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { signInAxios } from '@/api/api';
import { SignInErrors } from '@/api/auth/entities/errors';
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
      // Recharge la session complète (utilisateur + statut d'onboarding).
      refreshSession();
      toast.success('Signed in.');
    },
    promise: (data: SignInDto) => signInAxios(data),
  });
};

export { useSignIn };
