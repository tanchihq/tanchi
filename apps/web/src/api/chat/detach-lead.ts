import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ChatErrors } from './entities/errors';

const detachLead =
  (axios: AxiosInstance) =>
  async (id: string, leadId: string): Promise<void> => {
    try {
      await axios.delete(`/chat/${id}/leads/${leadId}`);
    } catch (error: unknown) {
      return throwApiError(error, ChatErrors.detachFailed);
    }
  };

export { detachLead };
