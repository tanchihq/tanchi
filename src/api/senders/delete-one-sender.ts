import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SenderErrors } from './entities/errors';

const deleteOneSender =
  (axios: AxiosInstance) =>
  async (id: string): Promise<void> => {
    try {
      await axios.delete(`/senders/${id}`);
    } catch (error: unknown) {
      return throwApiError(error, SenderErrors.deleteFailed);
    }
  };

export { deleteOneSender };
