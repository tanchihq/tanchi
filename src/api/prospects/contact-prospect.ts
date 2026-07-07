import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ProspectErrors } from './entities/errors';
import { type LeadDetailDto } from './entities/response.entities';

const contactProspect =
  (axios: AxiosInstance) =>
  async (id: string, senderId?: string): Promise<LeadDetailDto> => {
    try {
      const response = await axios.post<LeadDetailDto>(`/prospects/${id}/contact`, undefined, {
        params: senderId !== undefined ? { senderId } : undefined,
      });
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ProspectErrors.sendFailed);
    }
  };

export { contactProspect };
