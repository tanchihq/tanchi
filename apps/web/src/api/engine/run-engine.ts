import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';

export enum EngineErrors {
  noActiveOrganization = 'noActiveOrganization',
  noIcps = 'noIcps',
  runFailed = 'runFailed',
  subscriptionExpired = 'subscriptionExpired',
}

export type EngineRunSummaryDto = Readonly<{
  sourced: number;
  profiled: number;
  drafted: number;
}>;

const runEngine =
  (axios: AxiosInstance) => async (): Promise<EngineRunSummaryDto> => {
    try {
      const response = await axios.post<EngineRunSummaryDto>('/engine/run');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, EngineErrors.runFailed);
    }
  };

export { runEngine };
