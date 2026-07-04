import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { OnboardingProgressErrors } from './entities/errors';
import { type OnboardingStateDto } from './entities/response.entities';

const getOnboardingState =
  (axios: AxiosInstance) => async (): Promise<OnboardingStateDto> => {
    try {
      const response = await axios.get<OnboardingStateDto>('/onboarding/state');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(OnboardingProgressErrors.stateFetchFailed);
      }
      return throwSanitizeError(OnboardingProgressErrors.stateFetchFailed);
    }
  };

export { getOnboardingState };
