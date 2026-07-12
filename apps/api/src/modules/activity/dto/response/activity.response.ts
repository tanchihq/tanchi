export type ActivityItemDto = Readonly<{
  id: string;
  type: string;
  title: string;
  leadId: string | null;
  createdAt: string;
}>;

export type ActivityListDto = ReadonlyArray<ActivityItemDto>;

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
