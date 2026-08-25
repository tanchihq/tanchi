import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SettingsErrors } from './entities/errors';
import { type IntelligenceProviderDto } from './entities/settings.entities';

const getIntelligence =
  (axios: AxiosInstance) => async (): Promise<IntelligenceProviderDto> => {
    try {
      const response =
        await axios.get<IntelligenceProviderDto>('/settings/intelligence');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, SettingsErrors.fetchFailed);
    }
  };

export { getIntelligence };
