import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type QueueSkipReason } from '@/api/queue/entities/response.entities';
import {
  SKIP_REASON_OPTIONS,
  fullName,
  isEmailItem,
  type PendingAction,
} from '../utils';

type Properties = Readonly<{
  pending: PendingAction;
  delayMs: number;
  onUndo: () => void;
  onReason: (reason: QueueSkipReason) => void;
}>;

const pendingLabel = (pending: PendingAction): string => {
  if (pending.kind === 'skip')
    return `Skipped ${fullName(pending.item)} — why?`;
  if (isEmailItem(pending.item))
    return `Sending to ${pending.item.email ?? fullName(pending.item)}…`;
  return 'Message copied — marking it as sent…';
};

const PendingActionBar = ({
  pending,
  delayMs,
  onUndo,
  onReason,
}: Properties) => (
  <div
    role="status"
    className="border-app-line bg-app-raised h-fit w-full overflow-hidden rounded-2xl border shadow-[0_12px_30px_-20px_var(--app-drop)]"
  >
    <div className="flex flex-wrap items-center gap-2 p-[10px_12px]">
      <span className="text-app-fg min-w-0 flex-1 truncate text-[13px]">
        {pendingLabel(pending)}
      </span>
      <Button size="sm" variant="ghost" onClick={onUndo}>
        <Undo2 size={14} /> Undo
      </Button>
    </div>
    {pending.kind === 'skip' && (
      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
        {SKIP_REASON_OPTIONS.map((option) => (
          <button
            key={option.reason}
            type="button"
            onClick={() => onReason(option.reason)}
            className="border-app-line bg-app-hover text-app-soft hover:border-app-accent-line hover:text-app-fg flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] transition-colors"
          >
            <kbd className="text-app-faint text-[10.5px]">
              {option.shortcut}
            </kbd>
            {option.label}
          </button>
        ))}
      </div>
    )}
    <div
      key={`${pending.kind}-${pending.item.id}`}
      className="bg-brand-400 h-[2px] origin-left"
      style={{ animation: `queue-countdown ${delayMs}ms linear forwards` }}
    />
  </div>
);

export default PendingActionBar;
