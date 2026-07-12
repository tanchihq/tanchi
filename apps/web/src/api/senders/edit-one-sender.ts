import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { errorCode } from '@/api/shared/extract-error';
import { SenderErrors } from './entities/errors';
import { type EditSenderDto } from './entities/request.entities';
import { type SenderDto } from './entities/response.entities';

const editOneSender =
  (axios: AxiosInstance) =>
  async (id: string, dto: EditSenderDto): Promise<SenderDto> => {
    try {
      const response = await axios.patch<SenderDto>(`/senders/${id}`, dto);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(errorCode(error) ?? SenderErrors.updateFailed);
      }
      return throwSanitizeError(SenderErrors.updateFailed);
    }
  };

export { editOneSender };
