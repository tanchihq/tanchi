import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';
import { GetBillingStatusErrors } from './entities/errors';
import { type BillingStatusDto } from './entities/billing.entities';

const getBillingStatus =
  (axios: AxiosInstance) => async (): Promise<BillingStatusDto> => {
    try {
      const response = await axios.get<BillingStatusDto>('/billing/status');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, GetBillingStatusErrors.fetchFailed);
    }
  };

export { getBillingStatus };
