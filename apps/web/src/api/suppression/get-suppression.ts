import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SuppressionErrors } from './entities/errors';
import { type SuppressionEntryDto } from './entities/response.entities';

const getSuppression =
  (axios: AxiosInstance) => async (): Promise<ReadonlyArray<SuppressionEntryDto>> => {
    try {
      const response = await axios.get<ReadonlyArray<SuppressionEntryDto>>('/suppression');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, SuppressionErrors.fetchFailed);
    }
  };

export { getSuppression };
