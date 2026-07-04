import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { SignInErrors } from './entities/errors';
import { type ResendVerificationEmailDto } from './entities/request.entities';

// Better Auth : POST /auth/send-verification-email { email, callbackURL }.
const resendVerificationEmail =
  (axios: AxiosInstance) =>
  async (dto: ResendVerificationEmailDto): Promise<void> => {
    try {
      await axios.post('/auth/send-verification-email', dto);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(SignInErrors.signInFailed);
      }
      return throwSanitizeError(SignInErrors.signInFailed);
    }
  };

export { resendVerificationEmail };
