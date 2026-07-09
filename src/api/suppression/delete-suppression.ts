import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { SuppressionErrors } from './entities/errors';

const deleteSuppression =
  (axios: AxiosInstance) =>
  async (id: string): Promise<void> => {
    try {
      await axios.delete(`/suppression/${id}`);
    } catch (error: unknown) {
      return throwApiError(error, SuppressionErrors.deleteFailed);
    }
  };

export { deleteSuppression };
