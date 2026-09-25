import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { AutopilotErrors } from './entities/errors';
import { type AutopilotDto } from './entities/response.entities';

const getAutopilot =
  (axios: AxiosInstance) => async (): Promise<AutopilotDto> => {
    try {
      const response = await axios.get<AutopilotDto>('/autopilot');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, AutopilotErrors.fetchFailed);
    }
  };

export { getAutopilot };
