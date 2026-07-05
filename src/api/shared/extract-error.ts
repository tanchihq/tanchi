import { AxiosError } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';

export const errorCode = (error: unknown): string | undefined => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (
      data instanceof Object &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message;
    }
  }
  return undefined;
};

export const throwApiError = (error: unknown, fallback: string): never =>
  throwSanitizeError(errorCode(error) ?? fallback);
