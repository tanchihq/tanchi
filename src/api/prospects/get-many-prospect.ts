import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ProspectErrors } from './entities/errors';
import { type ProspectDto } from './entities/response.entities';

const getManyProspect =
  (axios: AxiosInstance) => async (): Promise<ReadonlyArray<ProspectDto>> => {
    try {
      const response = await axios.get<ReadonlyArray<ProspectDto>>('/prospects');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ProspectErrors.fetchFailed);
    }
  };

export { getManyProspect };
