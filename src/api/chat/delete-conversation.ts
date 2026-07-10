import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ChatErrors } from './entities/errors';

const deleteConversation =
  (axios: AxiosInstance) =>
  async (id: string): Promise<void> => {
    try {
      await axios.delete(`/chat/${id}`);
    } catch (error: unknown) {
      return throwApiError(error, ChatErrors.deleteFailed);
    }
  };

export { deleteConversation };
