import { type AxiosInstance } from 'axios';
import { throwApiError } from '@/api/shared/extract-error';

export type LearningDto = Readonly<{
  icp: string;
  points: ReadonlyArray<string>;
  stat: string;
}>;

const getLearnings =
  (axios: AxiosInstance) => async (): Promise<ReadonlyArray<LearningDto>> => {
    try {
      const response = await axios.get<ReadonlyArray<LearningDto>>('/learnings');
      return response.data;
    } catch (error: unknown) {
      return throwApiError(error, 'fetchFailed');
    }
  };

export { getLearnings };
