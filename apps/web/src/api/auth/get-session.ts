import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { SessionErrors } from './entities/errors';
import { type MeDto } from './entities/response.entities';

const getSession =
  (axios: AxiosInstance) => async (): Promise<MeDto> => {
    try {
      const response = await axios.get<MeDto>('/me');
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(SessionErrors.unauthenticated);
      }
      return throwSanitizeError(SessionErrors.unauthenticated);
    }
  };

export { getSession };
