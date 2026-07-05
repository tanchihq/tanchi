import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SenderErrors } from './entities/errors';

export type TestSenderResultDto = Readonly<{ connected: boolean }>;

const testOneSender =
  (axios: AxiosInstance) =>
  async (id: string): Promise<TestSenderResultDto> => {
    try {
      const response = await axios.post<TestSenderResultDto>(`/senders/${id}/test`);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, SenderErrors.connectionFailed);
    }
  };

export { testOneSender };
