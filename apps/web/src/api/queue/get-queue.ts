import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { QueueErrors } from './entities/errors';
import { type QueueDto } from './entities/response.entities';

const getQueue = (axios: AxiosInstance) => async (): Promise<QueueDto> => {
  try {
    const response = await axios.get<QueueDto>('/queue');
    return response.data;
  } catch (error: unknown) {
    return throwApiError(error, QueueErrors.fetchFailed);
  }
};

export { getQueue };
