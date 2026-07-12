import { useAsync } from '@/hooks/useAsync';
import { getOnboardingStateAxios } from '@/api/api';
import { type OnboardingStateDto } from '@/api/onboarding/entities/response.entities';

type Params = Readonly<{
  onLoaded: (state: OnboardingStateDto) => void;
  onFailed: () => void;
}>;

const useOnboardingState = ({ onLoaded, onFailed }: Params) =>
  useAsync({
    promise: () => getOnboardingStateAxios(),
    onSuccess: ({ returnedData }) => onLoaded(returnedData),
    onError: () => onFailed(),
  });

export { useOnboardingState };
