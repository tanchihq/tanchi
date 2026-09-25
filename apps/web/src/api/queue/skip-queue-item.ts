import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { QueueErrors } from './entities/errors';
import { type SkipQueueItemDto } from './entities/request.entities';
import { type QueueSkipResultDto } from './entities/response.entities';

const skipQueueItem =
  (axios: AxiosInstance) =>
  async (id: string, dto: SkipQueueItemDto): Promise<QueueSkipResultDto> => {
    try {
      const response = await axios.post<QueueSkipResultDto>(
        `/queue/${id}/skip`,
        dto,
      );
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, QueueErrors.skipFailed);
    }
  };

export { skipQueueItem };
