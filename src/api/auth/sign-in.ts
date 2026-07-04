import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import {
  BETTER_AUTH_INVALID_CREDENTIALS_CODES,
  SignInErrors,
} from './entities/errors';
import { type SignInDto } from './entities/request.entities';
import { type SignInResponseDto } from './entities/response.entities';

// Better Auth renvoie un code machine dans `error.response.data.code`.
const extractErrorCode = (error: AxiosError): string | undefined => {
  const data = error.response?.data;
  if (
    data instanceof Object &&
    'code' in data &&
    typeof data.code === 'string'
  ) {
    return data.code;
  }
  return undefined;
};

const signIn =
  (axios: AxiosInstance) =>
  async (dto: SignInDto): Promise<SignInResponseDto> => {
    try {
      const response = await axios.post<SignInResponseDto>(
        '/auth/sign-in/email',
        dto,
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const code = extractErrorCode(error);
        if (code !== undefined && BETTER_AUTH_INVALID_CREDENTIALS_CODES.includes(code)) {
          return throwSanitizeError(SignInErrors.invalidCredentials);
        }
      }
      return throwSanitizeError(SignInErrors.signInFailed);
    }
  };

export { signIn };
