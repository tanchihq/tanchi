import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { QueueErrors } from './entities/errors';
import { type QueueItemDto } from './entities/response.entities';

const editQueueItem =
  (axios: AxiosInstance) =>
  async ({
    id,
    message,
    subject,
  }: Readonly<{
    id: string;
    message: string;
    subject?: string | null;
  }>): Promise<QueueItemDto> => {
    try {
      const response = await axios.patch<QueueItemDto>(`/queue/${id}`, {
        message,
        ...(subject !== undefined && { subject }),
      });
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, QueueErrors.editFailed);
    }
  };

export { editQueueItem };
