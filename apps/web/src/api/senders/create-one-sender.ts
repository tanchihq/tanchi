import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { errorCode } from '@/api/shared/extract-error';
import { SenderErrors } from './entities/errors';
import { type CreateSenderDto } from './entities/request.entities';
import { type SenderDto } from './entities/response.entities';

const createOneSender =
  (axios: AxiosInstance) =>
  async (dto: CreateSenderDto): Promise<SenderDto> => {
    try {
      const response = await axios.post<SenderDto>('/senders', dto);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(errorCode(error) ?? SenderErrors.createFailed);
      }
      return throwSanitizeError(SenderErrors.createFailed);
    }
  };

export { createOneSender };
