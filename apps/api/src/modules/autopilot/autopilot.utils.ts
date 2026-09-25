import type {
  PgAutopilotCandidate,
  PgAutopilotSender,
  PgAutopilotSettings,
} from "./repository/autopilot/autopilot.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import {
  BOUNCE_RATE_MIN_SENT,
  BOUNCE_RATE_PAUSE_THRESHOLD,
  DEFAULT_MARKET_TIMEZONE,
  MARKET_TIMEZONES,
  MIN_MINUTES_BETWEEN_SENDS,
  SEND_WINDOW_END_HOUR,
  SEND_WINDOW_START_HOUR,
} from "./autopilot.constants.ts";

const MINUTE_MS = 60 * 1000;

const WEEKDAY_INDEX: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type SendAssignment = Readonly<{
  candidate: PgAutopilotCandidate;
  sender: PgAutopilotSender;
}>;

type LocalTime = Readonly<{ weekday: number; hour: number }>;

export function marketTimezone(country: string): string {
  return MARKET_TIMEZONES[country.toUpperCase()] ?? DEFAULT_MARKET_TIMEZONE;
}

function localTimeIn(now: Date, timeZone: string): LocalTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "0";
  return { weekday: WEEKDAY_INDEX[weekday] ?? now.getUTCDay(), hour: Number(hour) };
}

function safeLocalTime(now: Date, timeZone: string): LocalTime {
  try {
    return localTimeIn(now, timeZone);
  } catch {
    return localTimeIn(now, DEFAULT_MARKET_TIMEZONE);
  }
}

export function isWithinSendWindow(
  now: Date,
  timeZone: string,
  excludedWeekdays: ReadonlyArray<number>
): boolean {
  const local = safeLocalTime(now, timeZone);
  if (excludedWeekdays.includes(local.weekday)) return false;
  return local.hour >= SEND_WINDOW_START_HOUR && local.hour < SEND_WINDOW_END_HOUR;
}

export function isPausedForBounces(sender: PgAutopilotSender): boolean {
  if (sender.sent_in_window < BOUNCE_RATE_MIN_SENT) return false;
  return sender.bounced_in_window / sender.sent_in_window >= BOUNCE_RATE_PAUSE_THRESHOLD;
}

export function canSendNow(sender: PgAutopilotSender, now: Date): boolean {
  if (sender.sent_last_24h >= sender.daily_cap) return false;
  if (isPausedForBounces(sender)) return false;
  if (sender.last_sent_at === null) return true;
  return now.getTime() - sender.last_sent_at.getTime() >= MIN_MINUTES_BETWEEN_SENDS * MINUTE_MS;
}

function senderFor(
  candidate: PgAutopilotCandidate,
  available: ReadonlyArray<PgAutopilotSender>,
  activeSenderIds: ReadonlySet<string>,
  used: ReadonlySet<string>
): PgAutopilotSender | null {
  const previous = candidate.previous_sender_id;
  if (previous !== null && activeSenderIds.has(previous)) {
    return available.find((sender) => sender.id === previous && !used.has(sender.id)) ?? null;
  }
  return available.find((sender) => !used.has(sender.id)) ?? null;
}

export function assignSenders(
  candidates: ReadonlyArray<PgAutopilotCandidate>,
  available: ReadonlyArray<PgAutopilotSender>,
  activeSenderIds: ReadonlySet<string>
): ReadonlyArray<SendAssignment> {
  return candidates.reduce<
    Readonly<{ used: ReadonlySet<string>; assignments: ReadonlyArray<SendAssignment> }>
  >(
    (state, candidate) => {
      const sender = senderFor(candidate, available, activeSenderIds, state.used);
      if (sender === null) return state;
      return {
        used: new Set([...state.used, sender.id]),
        assignments: [...state.assignments, { candidate, sender }],
      };
    },
    { used: new Set<string>(), assignments: [] }
  ).assignments;
}

export function convertToAutopilotDto(
  settings: PgAutopilotSettings | null,
  icpsWithoutPlaybook: ReadonlyArray<string>,
  senders: ReadonlyArray<PgAutopilotSender>,
  queuedEmails: number
): ResponseDto.AutopilotDto {
  return {
    enabled: settings?.autopilot_enabled ?? false,
    updatedAt: settings?.autopilot_updated_at?.toISOString() ?? null,
    icpsWithoutPlaybook,
    hasActiveSender: senders.length > 0,
    sendWindow: {
      startHour: SEND_WINDOW_START_HOUR,
      endHour: SEND_WINDOW_END_HOUR,
    },
    senders: senders.map((sender) => ({
      id: sender.id,
      fromEmail: sender.from_email,
      dailyCap: sender.daily_cap,
      sentLast24h: sender.sent_last_24h,
      pausedForBounces: isPausedForBounces(sender),
    })),
    queuedEmails,
  };
}
