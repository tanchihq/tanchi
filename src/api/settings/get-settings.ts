import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SettingsErrors } from './entities/errors';
import { type SettingsDto } from './entities/settings.entities';

const getSettings =
  (axios: AxiosInstance) => async (): Promise<SettingsDto> => {
    try {
      const response = await axios.get<SettingsDto>('/settings');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, SettingsErrors.fetchFailed);
    }
  };

export { getSettings };
