import { type AutopilotDto } from '@/api/autopilot/entities/response.entities';

const hourLabel = (hour: number): string => `${hour}:00`;

const plural = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

export const statusLine = (autopilot: AutopilotDto): string => {
  if (!autopilot.enabled)
    return 'Every message waits for your swipe before it goes out.';
  const window = `${hourLabel(autopilot.sendWindow.startHour)}–${hourLabel(autopilot.sendWindow.endHour)}`;
  return `${plural(autopilot.queuedEmails, 'email')} queued · sent on their own ${window} on working days, spaced out, within each mailbox's daily limit.`;
};

export const joinNames = (names: ReadonlyArray<string>): string => {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1] ?? ''}`;
};

export type AutopilotWarning = Readonly<{ key: string; text: string }>;

export const autopilotWarnings = (
  autopilot: AutopilotDto,
): ReadonlyArray<AutopilotWarning> => {
  if (!autopilot.enabled) return [];
  const playbook: ReadonlyArray<AutopilotWarning> =
    autopilot.icpsWithoutPlaybook.length === 0
      ? []
      : [
          {
            key: 'playbook',
            text: `Not recommended yet: the AI doesn't know how you work on ${joinNames(autopilot.icpsWithoutPlaybook)}. Emails go out without a playbook built from your own reviews.`,
          },
        ];
  const mailbox: ReadonlyArray<AutopilotWarning> = autopilot.hasActiveSender
    ? []
    : [
        {
          key: 'mailbox',
          text: 'No active mailbox: nothing can go out. Connect one in the Mailbox tab.',
        },
      ];
  const paused = autopilot.senders
    .filter((sender) => sender.pausedForBounces)
    .map((sender) => ({
      key: `paused-${sender.id}`,
      text: `${sender.fromEmail} is paused: too many recent emails bounced. Clean your list before it resumes.`,
    }));
  return [...playbook, ...mailbox, ...paused];
};
