import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { normalizeOptionalUrl, normalizeUrl } from '@/utils/url';
import {
  type GenerateIcpsDto,
  type IcpDraft,
} from './entities/request.entities';

export type GeneratedIcpsDto = Readonly<{ icps: ReadonlyArray<IcpDraft> }>;

const generateOnboardingIcps =
  (axios: AxiosInstance) =>
  async (dto: GenerateIcpsDto): Promise<GeneratedIcpsDto> => {
    try {
      const response = await axios.post<GeneratedIcpsDto>(
        '/onboarding/generate-icps',
        {
          market: dto.market,
          companyName: dto.companyName,
          website: normalizeUrl(dto.website),
          productPageUrl: normalizeOptionalUrl(dto.productPageUrl),
          salesDeckUrl: normalizeOptionalUrl(dto.salesDeckUrl),
          companyProfile: dto.companyProfile,
          count: dto.count,
        },
      );
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, 'generationFailed');
    }
  };

export { generateOnboardingIcps };
