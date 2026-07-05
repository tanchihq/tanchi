import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { type GenerateProfileDto } from './entities/request.entities';

export type GeneratedProfileDto = Readonly<{ companyProfile: string }>;

const generateOnboardingProfile =
  (axios: AxiosInstance) =>
  async (dto: GenerateProfileDto): Promise<GeneratedProfileDto> => {
    try {
      const response = await axios.post<GeneratedProfileDto>(
        '/onboarding/generate-profile',
        dto,
      );
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, 'generationFailed');
    }
  };

export { generateOnboardingProfile };
