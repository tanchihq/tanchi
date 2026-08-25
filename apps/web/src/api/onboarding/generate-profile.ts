import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { normalizeOptionalUrl, normalizeUrl } from '@/utils/url';
import { type GenerateProfileDto } from './entities/request.entities';

export type GeneratedProfileDto = Readonly<{ companyProfile: string }>;

const generateOnboardingProfile =
  (axios: AxiosInstance) =>
  async (dto: GenerateProfileDto): Promise<GeneratedProfileDto> => {
    try {
      const response = await axios.post<GeneratedProfileDto>(
        '/onboarding/generate-profile',
        {
          market: dto.market,
          companyName: dto.companyName,
          website: normalizeUrl(dto.website),
          productPageUrl: normalizeOptionalUrl(dto.productPageUrl),
          salesDeckUrl: normalizeOptionalUrl(dto.salesDeckUrl),
        },
      );
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, 'generationFailed');
    }
  };

export { generateOnboardingProfile };
