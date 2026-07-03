import axios, { AxiosError } from 'axios';

// Single backend (Hono). Modules are route prefixes, not separate services,
// so one instance is enough. Auth is cookie-based via Better Auth, hence
// `withCredentials`.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL_API,
  withCredentials: true,
});

const handleAuthError = (error: AxiosError): Promise<never> => {
  const authErrors: ReadonlyArray<string> = [
    'accessTokenMissing',
    'invalidToken',
    'tokenExpired',
    'authenticationFailed',
  ];

  const message =
    error.response?.data instanceof Object &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
      ? error.response.data.message
      : undefined;

  if (message !== undefined && authErrors.includes(message)) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/') {
      window.location.href = '/';
    }
  }

  return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      return handleAuthError(error);
    }
    return Promise.reject(error);
  },
);

export { axiosInstance };
