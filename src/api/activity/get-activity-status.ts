import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { type ActivityStatusDto } from './entities/response.entities';

const getActivityStatus =
  (axios: AxiosInstance) => async (): Promise<ActivityStatusDto> => {
    try {
      const response = await axios.get<ActivityStatusDto>('/activity/status');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, 'fetchFailed');
    }
  };

export { getActivityStatus };
