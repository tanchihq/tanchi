import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { SignUpErrors } from './entities/errors';
import { type SignUpDto } from './entities/request.entities';
import { type SignedUpDto } from './entities/response.entities';

const extractErrorCode = (error: AxiosError): string | undefined => {
  const data = error.response?.data;
  if (
    data instanceof Object &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }
  return undefined;
};

const signUp =
  (axios: AxiosInstance) =>
  async (dto: SignUpDto): Promise<SignedUpDto> => {
    try {
      const response = await axios.post<SignedUpDto>('/onboarding/sign-up', dto);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        switch (extractErrorCode(error)) {
          case SignUpErrors.invalidEmail:
            return throwSanitizeError(SignUpErrors.invalidEmail);
          case SignUpErrors.invalidPassword:
            return throwSanitizeError(SignUpErrors.invalidPassword);
          case SignUpErrors.invalidFirstName:
            return throwSanitizeError(SignUpErrors.invalidFirstName);
          case SignUpErrors.invalidLastName:
            return throwSanitizeError(SignUpErrors.invalidLastName);
          case SignUpErrors.invalidCompany:
            return throwSanitizeError(SignUpErrors.invalidCompany);
          case SignUpErrors.emailAlreadyExists:
            return throwSanitizeError(SignUpErrors.emailAlreadyExists);
          case SignUpErrors.signupDisabled:
            return throwSanitizeError(SignUpErrors.signupDisabled);
          case SignUpErrors.organizationCreationFailed:
            return throwSanitizeError(SignUpErrors.organizationCreationFailed);
          default:
            return throwSanitizeError(SignUpErrors.signUpFailed);
        }
      }
      return throwSanitizeError(SignUpErrors.signUpFailed);
    }
  };

export { signUp };
