import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ProspectErrors } from './entities/errors';
import { type ExcludeProspectDto } from './entities/request.entities';

const deleteProspect =
  (axios: AxiosInstance) =>
  async (id: string, dto: ExcludeProspectDto): Promise<void> => {
    try {
      await axios.delete(`/prospects/${id}`, { data: dto });
    } catch (error: unknown) {
      return throwApiError(error, ProspectErrors.deleteFailed);
    }
  };

export { deleteProspect };
