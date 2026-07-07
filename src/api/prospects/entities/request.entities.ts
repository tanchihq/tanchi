import { type Origin, type Stage } from '@/api/shared/enums';

export type MoveStageDto = Readonly<{
  stage: Stage;
  origin: Origin;
}>;
