import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { type ActivityItemDto } from './entities/response.entities';

const getActivity =
  (axios: AxiosInstance) =>
  async (limit = 50): Promise<ReadonlyArray<ActivityItemDto>> => {
    try {
      const response = await axios.get<ReadonlyArray<ActivityItemDto>>('/activity', {
        params: { limit },
      });
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, 'fetchFailed');
    }
  };

export { getActivity };
