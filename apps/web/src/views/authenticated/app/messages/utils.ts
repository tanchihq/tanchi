import {
  type QueueItemDto,
  type QueueSkipNextStep,
  type QueueSkipReason,
} from '@/api/queue/entities/response.entities';
import { QueueErrors } from '@/api/queue/entities/errors';

export const UNDO_DELAY_MS = 5000;

export type SkipReasonOption = Readonly<{
  reason: QueueSkipReason;
  label: string;
  shortcut: string;
}>;

export const SKIP_REASON_OPTIONS: ReadonlyArray<SkipReasonOption> = [
  { reason: 'wrong_lead', label: 'Wrong lead', shortcut: '1' },
  { reason: 'wrong_angle', label: 'Wrong angle', shortcut: '2' },
  { reason: 'too_generic', label: 'Too generic', shortcut: '3' },
  { reason: 'not_now', label: 'Not now', shortcut: '4' },
];

export type PendingAction =
  | Readonly<{ kind: 'send'; item: QueueItemDto }>
  | Readonly<{
      kind: 'skip';
      item: QueueItemDto;
      reason: QueueSkipReason | null;
    }>;

export const fullName = (item: QueueItemDto): string => {
  const name = [item.firstName, item.lastName]
    .filter((part) => part !== '')
    .join(' ');
  return name === '' ? 'Unknown contact' : name;
};

export const isEmailItem = (item: QueueItemDto): boolean =>
  item.channel === 'email' && item.email !== null;

export const withAutoSend = (
  items: ReadonlyArray<QueueItemDto>,
  enabled: boolean,
): ReadonlyArray<QueueItemDto> =>
  items.map((item) => ({ ...item, autoSend: enabled && isEmailItem(item) }));

export const withoutItem = (
  items: ReadonlyArray<QueueItemDto>,
  id: string,
): ReadonlyArray<QueueItemDto> => items.filter((item) => item.id !== id);

export const withItemFirst = (
  items: ReadonlyArray<QueueItemDto>,
  item: QueueItemDto,
): ReadonlyArray<QueueItemDto> => [item, ...withoutItem(items, item.id)];

export const replaceItem = (
  items: ReadonlyArray<QueueItemDto>,
  next: QueueItemDto,
): ReadonlyArray<QueueItemDto> =>
  items.map((item) => (item.id === next.id ? next : item));

export const skipOutcomeMessage = (nextStep: QueueSkipNextStep): string => {
  switch (nextStep) {
    case 'excluded':
      return "Lead excluded. The agent won't contact this person again.";
    case 'snoozed':
      return 'Lead snoozed.';
    case 'redraft':
      return 'Noted. A new draft will be ready after the next run.';
  }
};

export const sendErrorMessage = (code: string): string => {
  switch (code) {
    case QueueErrors.noSender:
      return 'Connect a mailbox first (Mailbox tab).';
    case QueueErrors.inexistingDraft:
      return 'This draft is no longer available.';
    default:
      return "Couldn't send. The draft is back in your queue.";
  }
};

export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export const handOffManualMessage = (item: QueueItemDto): void => {
  void navigator.clipboard?.writeText(item.message).catch(() => undefined);
  if (item.profileUrl !== null)
    window.open(item.profileUrl, '_blank', 'noopener,noreferrer');
};

export const emptyHint = (autopilotEnabled: boolean): string =>
  autopilotEnabled
    ? 'Autopilot sends queued emails during business hours. New drafts land here after the next run.'
    : 'New drafts land here after the next run. Swipe right to send, left to skip.';

export const sendButtonLabel = (item: QueueItemDto): string => {
  if (!isEmailItem(item)) return 'Copy & mark sent';
  return item.autoSend ? 'Send now' : 'Send';
};

export const isDialogOpen = (): boolean =>
  document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
