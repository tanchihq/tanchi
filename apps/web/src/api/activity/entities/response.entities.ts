export type ActivityType =
  | 'run_started'
  | 'run_done'
  | 'sourced'
  | 'profiled'
  | 'drafted'
  | 'sent'
  | 'reply'
  | 'follow_up'
  | 'closed'
  | 'bounced';

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
  pendingReview: number;
}>;

export type ActivityItemDto = Readonly<{
  id: string;
  type: ActivityType;
  title: string;
  leadId: string | null;
  createdAt: string;
}>;
