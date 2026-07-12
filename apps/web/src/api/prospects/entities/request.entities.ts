import { type ExclusionScope, type Origin, type Stage } from '@/api/shared/enums';

export type MoveStageDto = Readonly<{
  stage: Stage;
  origin: Origin;
}>;

export type ExcludeProspectDto = Readonly<{
  scope: ExclusionScope;
  reason?: string;
}>;
