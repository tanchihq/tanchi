import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { QueueErrors } from './entities/errors';
import { type QueueItemDto } from './entities/response.entities';

const validateQueueItem =
  (axios: AxiosInstance) =>
  async (id: string): Promise<QueueItemDto> => {
    try {
      const response = await axios.post<QueueItemDto>(`/queue/${id}/validate`);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, QueueErrors.sendFailed);
    }
  };

export { validateQueueItem };
