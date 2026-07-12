import { useState } from 'react';

type OnFetchFn<Data> = (
  data: Data,
  options?: { onSuccess?: () => void },
) => void;

type OnErrorArguments<Data> = {
  error: Error;
  data: Data;
};

type OnSuccessArguments<AsyncFnReturn, Data> = {
  data: Data;
  returnedData: AsyncFnReturn;
};

type UseAsyncArguments<AsyncFnReturn, Data = void> = {
  promise: (data: Data) => Promise<AsyncFnReturn>;
  onSuccess?: ({
    returnedData,
    data,
  }: OnSuccessArguments<AsyncFnReturn, Data>) => void;
  onError?: ({ error, data }: OnErrorArguments<Data>) => void;
};

type UseAsyncReturn<AsyncFnReturn, Data> = {
  isLoading: boolean;
  isError: boolean;
  status: null | 'success';
  data: AsyncFnReturn;
  errorMessage: string;
  onFetch: OnFetchFn<Data>;
};

export const useAsyncEvent = <T, U>({
  promise,
  onSuccess,
  onError,
}: UseAsyncArguments<T, U>): UseAsyncReturn<T, U> => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<null | 'success'>(null);
  const [data, setData] = useState<T>(undefined as T);

  const fetch = async (data: U) => {
    setIsLoading(true);
    setErrorMessage('');
    setStatus(null);
    setIsError(false);

    try {
      const result = await promise(data);

      setData(result);
      setStatus('success');

      if (onSuccess !== undefined) {
        onSuccess({ data, returnedData: result });
      }
    } catch (error: unknown) {
      setIsError(true);
      setErrorMessage((error as Error).message);
      if (onError !== undefined) {
        onError({ data, error: error as Error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onFetch: UseAsyncReturn<T, U>['onFetch'] = async (data, options) => {
    await fetch(data);

    if (options !== undefined) {
      const { onSuccess } = options;
      if (onSuccess !== undefined) {
        onSuccess();
      }
    }
  };

  return { data, errorMessage, isError, isLoading, onFetch, status };
};

export type { OnFetchFn };
