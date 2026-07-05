import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { type MessageStatus, type MessageHistoryDto } from './entities/response.entities';

export type GetMessagesQuery = Readonly<{
  status?: MessageStatus;
  leadId?: string;
  limit?: number;
}>;

const getMessages =
  (axios: AxiosInstance) =>
  async (query: GetMessagesQuery = {}): Promise<ReadonlyArray<MessageHistoryDto>> => {
    try {
      const response = await axios.get<ReadonlyArray<MessageHistoryDto>>('/messages', {
        params: query,
      });
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, 'fetchFailed');
    }
  };

export { getMessages };
