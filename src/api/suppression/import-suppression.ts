import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { errorCode } from '@/api/shared/extract-error';
import { SuppressionErrors } from './entities/errors';
import { type ImportSuppressionResultDto } from './entities/response.entities';

const importSuppression =
  (axios: AxiosInstance) =>
  async (file: File): Promise<ImportSuppressionResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post<ImportSuppressionResultDto>(
        '/suppression/import',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(errorCode(error) ?? SuppressionErrors.importFailed);
      }
      return throwSanitizeError(SuppressionErrors.importFailed);
    }
  };

export { importSuppression };
