import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { ProspectErrors } from './entities/errors';
import { type MoveStageDto } from './entities/request.entities';
import { type ProspectDto } from './entities/response.entities';

const moveProspectStage =
  (axios: AxiosInstance) =>
  async ({ id, ...dto }: MoveStageDto & Readonly<{ id: string }>): Promise<ProspectDto> => {
    try {
      const response = await axios.patch<ProspectDto>(
        `/prospects/${id}/stage`,
        dto,
      );
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, ProspectErrors.updateFailed);
    }
  };

export { moveProspectStage };
