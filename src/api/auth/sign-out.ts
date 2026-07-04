import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { SessionErrors } from './entities/errors';

// Better Auth : POST /auth/sign-out. Efface la session côté serveur.
const signOut =
  (axios: AxiosInstance) => async (): Promise<void> => {
    try {
      await axios.post('/auth/sign-out');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(SessionErrors.signOutFailed);
      }
      return throwSanitizeError(SessionErrors.signOutFailed);
    }
  };

export { signOut };
