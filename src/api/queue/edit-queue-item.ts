import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { QueueErrors } from './entities/errors';
import { type QueueItemDto } from './entities/response.entities';

const editQueueItem =
  (axios: AxiosInstance) =>
  async ({ id, message }: Readonly<{ id: string; message: string }>): Promise<QueueItemDto> => {
    try {
      const response = await axios.patch<QueueItemDto>(`/queue/${id}`, { message });
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, QueueErrors.editFailed);
    }
  };

export { editQueueItem };
