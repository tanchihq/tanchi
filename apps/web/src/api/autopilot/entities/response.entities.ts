export type AutopilotSenderDto = Readonly<{
  id: string;
  fromEmail: string;
  dailyCap: number;
  sentLast24h: number;
  pausedForBounces: boolean;
}>;

export type AutopilotDto = Readonly<{
  enabled: boolean;
  updatedAt: string | null;
  icpsWithoutPlaybook: ReadonlyArray<string>;
  hasActiveSender: boolean;
  sendWindow: Readonly<{ startHour: number; endHour: number }>;
  senders: ReadonlyArray<AutopilotSenderDto>;
  queuedEmails: number;
}>;
