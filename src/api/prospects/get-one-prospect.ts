import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ProspectErrors } from './entities/errors';
import { type LeadDetailDto } from './entities/response.entities';

const getOneProspect =
  (axios: AxiosInstance) =>
  async (id: string): Promise<LeadDetailDto> => {
    try {
      const response = await axios.get<LeadDetailDto>(`/prospects/${id}`);
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ProspectErrors.fetchFailed);
    }
  };

export { getOneProspect };
