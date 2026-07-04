import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { OnboardingProgressErrors } from './entities/errors';
import { type SaveOnboardingProgressDto } from './entities/request.entities';

// Autosave du brouillon d'onboarding. Best-effort : l'appelant ignore l'échec.
const saveOnboardingProgress =
  (axios: AxiosInstance) =>
  async (dto: SaveOnboardingProgressDto): Promise<void> => {
    try {
      await axios.put('/onboarding/progress', dto);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(OnboardingProgressErrors.saveFailed);
      }
      return throwSanitizeError(OnboardingProgressErrors.saveFailed);
    }
  };

export { saveOnboardingProgress };
