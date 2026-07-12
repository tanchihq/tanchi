import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ChatErrors } from './entities/errors';
import { type ChatConversationSummaryDto } from './entities/response.entities';

const getConversations =
  (axios: AxiosInstance) =>
  async (): Promise<ReadonlyArray<ChatConversationSummaryDto>> => {
    try {
      const response =
        await axios.get<ReadonlyArray<ChatConversationSummaryDto>>('/chat');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ChatErrors.fetchFailed);
    }
  };

export { getConversations };
