import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { CompleteOnboardingErrors } from './entities/errors';
import { type CompleteOnboardingDto } from './entities/request.entities';

const extractErrorCode = (error: AxiosError): string | undefined => {
  const data = error.response?.data;
  if (
    data instanceof Object &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }
  return undefined;
};

const completeOnboarding =
  (axios: AxiosInstance) =>
  async (dto: CompleteOnboardingDto): Promise<void> => {
    try {
      await axios.post('/onboarding/complete', dto);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        switch (extractErrorCode(error)) {
          case CompleteOnboardingErrors.noActiveOrganization:
            return throwSanitizeError(
              CompleteOnboardingErrors.noActiveOrganization,
            );
          case CompleteOnboardingErrors.invalidCompanyName:
            return throwSanitizeError(
              CompleteOnboardingErrors.invalidCompanyName,
            );
          case CompleteOnboardingErrors.invalidWebsite:
            return throwSanitizeError(CompleteOnboardingErrors.invalidWebsite);
          case CompleteOnboardingErrors.invalidResource:
            return throwSanitizeError(CompleteOnboardingErrors.invalidResource);
          case CompleteOnboardingErrors.invalidIcp:
            return throwSanitizeError(CompleteOnboardingErrors.invalidIcp);
          case CompleteOnboardingErrors.tooManyIcps:
            return throwSanitizeError(CompleteOnboardingErrors.tooManyIcps);
          default:
            return throwSanitizeError(
              CompleteOnboardingErrors.onboardingFailed,
            );
        }
      }
      return throwSanitizeError(CompleteOnboardingErrors.onboardingFailed);
    }
  };

export { completeOnboarding };
