export type ActivityType =
  | 'run_started'
  | 'run_done'
  | 'profiled'
  | 'drafted'
  | 'sent'
  | 'reply';

export type ActivityStatusDto = Readonly<{
  isRunning: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  today: Readonly<{
    researched: number;
    drafted: number;
    sent: number;
    replies: number;
  }>;
}>;

export type ActivityItemDto = Readonly<{
  id: string;
  type: ActivityType;
  title: string;
  leadId: string | null;
  createdAt: string;
}>;
