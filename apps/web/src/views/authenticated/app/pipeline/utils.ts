import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import { TONIGHT_STAGES } from '@/utils/prospect-display';
import { isDueToday } from '@/utils/format';

export const needsTonight = (prospect: ProspectDto): boolean =>
  TONIGHT_STAGES.includes(prospect.stage) ||
  (prospect.stage === 'following-up' && isDueToday(prospect.nextFollowUpAt));
