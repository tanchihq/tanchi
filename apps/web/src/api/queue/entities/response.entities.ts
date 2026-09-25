import { type Channel } from '@/api/shared/enums';
import { type ProspectFactDto } from '@/api/prospects/entities/response.entities';

export type QueueItemKind = 'first-touch' | 'follow-up';

export type QueueSkipReason =
  'wrong_lead' | 'wrong_angle' | 'too_generic' | 'not_now';

export type QueueSkipNextStep = 'excluded' | 'snoozed' | 'redraft';

export type QueuePreviousMessageDto = Readonly<{
  subject: string | null;
  body: string;
  sentAt: string | null;
}>;

export type QueueAngleDto = Readonly<{
  title: string;
  note: string | null;
  fact: ProspectFactDto | null;
}>;

export type QueueItemDto = Readonly<{
  id: string;
  messageId: string;
  firstName: string;
  lastName: string;
  role: string | null;
  company: string;
  channel: Channel;
  hot: boolean;
  done: boolean;
  status: string;
  subject: string | null;
  facts: ReadonlyArray<ProspectFactDto>;
  angle: string;
  chosenAngle: QueueAngleDto | null;
  message: string;
  kind: QueueItemKind;
  followUpNumber: number;
  previousMessage: QueuePreviousMessageDto | null;
  email: string | null;
  profileUrl: string | null;
  score: number | null;
  qualification: string | null;
  autoSend: boolean;
}>;

export type QueueDto = Readonly<{
  preparedAt: string | null;
  autopilotEnabled: boolean;
  items: ReadonlyArray<QueueItemDto>;
}>;

export type QueueSkipResultDto = Readonly<{
  id: string;
  messageId: string;
  reason: QueueSkipReason | null;
  nextStep: QueueSkipNextStep;
}>;
