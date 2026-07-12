import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { MessageErrors } from './entities/errors';
import { type EditMessageDto } from './entities/request.entities';
import { type EditMessageResultDto } from './entities/response.entities';

const editMessage =
  (axios: AxiosInstance) =>
  async (id: string, dto: EditMessageDto): Promise<EditMessageResultDto> => {
    try {
      const response = await axios.patch<EditMessageResultDto>(`/messages/${id}`, dto);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, MessageErrors.updateFailed);
    }
  };

export { editMessage };
