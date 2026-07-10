import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ChatErrors } from './entities/errors';
import { type AttachLeadDto } from './entities/request.entities';
import { type ChatLeadDto } from './entities/response.entities';

const attachLead =
  (axios: AxiosInstance) =>
  async (id: string, dto: AttachLeadDto): Promise<ChatLeadDto> => {
    try {
      const response = await axios.post<ChatLeadDto>(`/chat/${id}/leads`, dto);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ChatErrors.attachFailed);
    }
  };

export { attachLead };
