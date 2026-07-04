import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { SessionErrors } from './entities/errors';
import { type MeDto } from './entities/response.entities';

// GET /me — utilisateur courant. Un 401 (non connecté) est un cas normal :
// l'appelant l'interprète comme "non authentifié".
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
