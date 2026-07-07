import { AxiosError, type AxiosInstance } from 'axios';
import { throwSanitizeError } from '@/utils/lib/utils';
import { normalizeOptionalUrl, normalizeUrl } from '@/utils/url';
import { errorCode } from '@/api/shared/extract-error';
import { SettingsErrors } from './entities/errors';
import { type SettingsDto } from './entities/settings.entities';

const updateSettings =
  (axios: AxiosInstance) =>
  async (dto: SettingsDto): Promise<SettingsDto> => {
    try {
      const response = await axios.put<SettingsDto>('/settings', {
        ...dto,
        company: { ...dto.company, website: normalizeUrl(dto.company.website) },
        resources: {
          productPageUrl: normalizeOptionalUrl(dto.resources.productPageUrl),
          salesDeckUrl: normalizeOptionalUrl(dto.resources.salesDeckUrl),
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return throwSanitizeError(errorCode(error) ?? SettingsErrors.updateFailed);
      }
      return throwSanitizeError(SettingsErrors.updateFailed);
    }
  };

export { updateSettings };
