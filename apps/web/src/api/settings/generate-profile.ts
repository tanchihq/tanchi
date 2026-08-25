import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SettingsErrors } from './entities/errors';
import {
  type GeneratedProfileDto,
  type GenerateProfileMarketDto,
} from './entities/settings.entities';

const generateProfile =
  (axios: AxiosInstance) =>
  async (dto: GenerateProfileMarketDto): Promise<GeneratedProfileDto> => {
    try {
      const response = await axios.post<GeneratedProfileDto>(
        '/settings/generate-profile',
        dto,
      );
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, SettingsErrors.generationFailed);
    }
  };

export { generateProfile };
