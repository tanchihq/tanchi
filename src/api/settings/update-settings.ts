import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { errorCode } from '@/api/shared/extract-error';
import { SettingsErrors } from './entities/errors';
import { type SettingsDto } from './entities/settings.entities';

const updateSettings =
  (axios: AxiosInstance) =>
  async (dto: SettingsDto): Promise<SettingsDto> => {
    try {
      const response = await axios.put<SettingsDto>('/settings', dto);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(errorCode(error) ?? SettingsErrors.updateFailed);
      }
      return throwSanitizeError(SettingsErrors.updateFailed);
    }
  };

export { updateSettings };
