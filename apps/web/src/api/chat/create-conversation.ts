import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ChatErrors } from './entities/errors';
import { type CreateConversationDto } from './entities/request.entities';
import { type ChatConversationSummaryDto } from './entities/response.entities';

const createConversation =
  (axios: AxiosInstance) =>
  async (dto: CreateConversationDto = {}): Promise<ChatConversationSummaryDto> => {
    try {
      const response = await axios.post<ChatConversationSummaryDto>('/chat', dto);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ChatErrors.createFailed);
    }
  };

export { createConversation };
