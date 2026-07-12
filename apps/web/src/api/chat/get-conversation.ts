import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ChatErrors } from './entities/errors';
import { type ChatConversationDto } from './entities/response.entities';

const getConversation =
  (axios: AxiosInstance) =>
  async (id: string): Promise<ChatConversationDto> => {
    try {
      const response = await axios.get<ChatConversationDto>(`/chat/${id}`);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ChatErrors.fetchFailed);
    }
  };

export { getConversation };
