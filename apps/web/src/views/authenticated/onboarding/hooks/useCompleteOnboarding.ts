import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { completeOnboardingAxios } from '@/api/api';
import { CompleteOnboardingErrors } from '@/api/onboarding/entities/errors';
import { type CompleteOnboardingDto } from '@/api/onboarding/entities/request.entities';
import { useAuth } from '@/store/context/auth.context';

const useCompleteOnboarding = () => {
  const { dispatch } = useAuth();

  return useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case CompleteOnboardingErrors.noActiveOrganization:
          toast.error('No active organization found.');
          break;
        case CompleteOnboardingErrors.invalidWebsite:
          toast.error('Please enter a valid website URL.');
          break;
        case CompleteOnboardingErrors.tooManyIcps:
          toast.error('You can define at most 3 ideal client profiles.');
          break;
        case CompleteOnboardingErrors.invalidCompanyName:
        case CompleteOnboardingErrors.invalidResource:
        case CompleteOnboardingErrors.invalidIcp:
          toast.error('Some fields are invalid, please review them.');
          break;
        default:
          toast.error('Something went wrong, please try again later.');
      }
    },
    onSuccess: () => {
      dispatch({ type: 'ONBOARDING_COMPLETED' });
      toast.success('Setup complete.');
    },
    promise: (data: CompleteOnboardingDto) => completeOnboardingAxios(data),
  });
};

export { useCompleteOnboarding };
