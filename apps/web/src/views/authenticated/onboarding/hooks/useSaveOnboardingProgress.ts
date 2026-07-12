import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { saveOnboardingProgressAxios } from '@/api/api';
import { type SaveOnboardingProgressDto } from '@/api/onboarding/entities/request.entities';

const useSaveOnboardingProgress = () =>
  useAsyncEvent({
    onError: () => {},
    promise: (data: SaveOnboardingProgressDto) =>
      saveOnboardingProgressAxios(data),
  });

export { useSaveOnboardingProgress };
