import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { signUpAxios } from '@/api/api';
import { SignUpErrors } from '@/api/onboarding/entities/errors';
import { type SignUpDto } from '@/api/onboarding/entities/request.entities';
import { useAuth } from '@/store/context/auth.context';

const useSignUp = () => {
  const { refreshSession } = useAuth();

  return useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case SignUpErrors.emailAlreadyExists:
          toast.error('An account already exists with this email.');
          break;
        case SignUpErrors.invalidEmail:
          toast.error('Invalid email.');
          break;
        case SignUpErrors.invalidPassword:
          toast.error('Invalid password (at least 8 characters).');
          break;
        case SignUpErrors.invalidFirstName:
        case SignUpErrors.invalidLastName:
          toast.error('Invalid name.');
          break;
        case SignUpErrors.invalidCompany:
          toast.error('Invalid company name.');
          break;
        default:
          toast.error('Something went wrong, please try again later.');
      }
    },
    onSuccess: () => {
      // Recharge la session : le nouvel utilisateur est authentifié, onboarding
      // "in_progress".
      refreshSession();
      toast.success('Account created.');
    },
    promise: (data: SignUpDto) => signUpAxios(data),
  });
};

export { useSignUp };
