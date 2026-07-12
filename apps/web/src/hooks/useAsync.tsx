import { useEffect, useState } from 'react';

type OnSuccessArguments<AsyncFnReturn> = {
  returnedData: AsyncFnReturn;
};

type UseAsyncArguments<AsyncFnReturn> = {
  promise: () => Promise<AsyncFnReturn>;
  onSuccess?: ({ returnedData }: OnSuccessArguments<AsyncFnReturn>) => void;
  onError?: (error: Error) => void;
};

type UseAsyncReturn<AsyncFnReturn> = {
  status: 'error' | 'loading' | 'success';
  data: AsyncFnReturn;
  refetch: () => void;
  errorMessage: string;
};

export const useAsync = <T,>({
  promise,
  onSuccess,
  onError,
}: UseAsyncArguments<T>): UseAsyncReturn<T> => {
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<'error' | 'loading' | 'success'>(
    'loading',
  );
  const [data, setData] = useState<T>(undefined as T);

  const fetch = async (fetchPromise: Promise<T>) => {
    setErrorMessage('');
    setStatus('loading');

    try {
      const result = await fetchPromise;

      setData(result);
      setStatus('success');

      if (onSuccess !== undefined) {
        onSuccess({ returnedData: result });
      }
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage((error as Error).message);
      if (onError !== undefined) {
        onError(error as Error);
      }
    }
  };

  const refetch = () => fetch(promise());

  useEffect(() => {
    void fetch(promise());
  }, []);

  return { data, errorMessage, refetch, status };
};
