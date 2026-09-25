import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { AutopilotErrors } from './entities/errors';
import { type UpdateAutopilotDto } from './entities/request.entities';
import { type AutopilotDto } from './entities/response.entities';

const updateAutopilot =
  (axios: AxiosInstance) =>
  async (dto: UpdateAutopilotDto): Promise<AutopilotDto> => {
    try {
      const response = await axios.put<AutopilotDto>('/autopilot', dto);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, AutopilotErrors.updateFailed);
    }
  };

export { updateAutopilot };
