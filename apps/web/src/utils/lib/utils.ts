import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ReadonlyArray<ClassValue>): string =>
  twMerge(clsx(inputs));

export const isEmpty = (
  data: Readonly<Record<string, unknown>> | string | ReadonlyArray<unknown>,
): boolean => {
  if (typeof data === 'string') {
    return data.trim().length === 0;
  }
  if (Array.isArray(data)) {
    return data.length === 0;
  }
  return Object.keys(data).length === 0;
};

const sanitizeError = (maybeError: unknown): Error => {
  if (maybeError instanceof Error) {
    return maybeError;
  }
  if (typeof maybeError === 'string') {
    return new Error(maybeError);
  }
  return new Error('Unexpected error');
};

export const throwSanitizeError = (message: string): never => {
  throw sanitizeError(message);
};
