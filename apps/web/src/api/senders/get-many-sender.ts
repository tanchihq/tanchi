import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SenderErrors } from './entities/errors';
import { type SenderDto } from './entities/response.entities';

const getManySender =
  (axios: AxiosInstance) => async (): Promise<ReadonlyArray<SenderDto>> => {
    try {
      const response = await axios.get<ReadonlyArray<SenderDto>>('/senders');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, SenderErrors.fetchFailed);
    }
  };

export { getManySender };
