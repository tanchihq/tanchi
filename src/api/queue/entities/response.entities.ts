import { type Channel } from '@/api/shared/enums';
import { type ProspectFactDto } from '@/api/prospects/entities/response.entities';

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
  subject: string | null;
  facts: ReadonlyArray<ProspectFactDto>;
  angle: string;
  message: string;
}>;

export type QueueDto = Readonly<{
  preparedAt: string | null;
  items: ReadonlyArray<QueueItemDto>;
}>;
