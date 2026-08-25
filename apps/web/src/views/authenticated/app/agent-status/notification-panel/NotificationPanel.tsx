import {
  Activity,
  Check,
  MessageSquare,
  PenLine,
  Play,
  Search,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { type ActivityItemDto } from '@/api/activity/entities/response.entities';
import { relativeTime } from '@/utils/format';

type ActivityMeta = Readonly<{ icon: LucideIcon; color: string }>;

const TYPE_META: Readonly<Record<string, ActivityMeta>> = {
  run_started: { icon: Play, color: 'var(--app-accent-fg)' },
  run_done: { icon: Check, color: 'var(--app-success-fg)' },
  sourced: { icon: Search, color: 'var(--app-faint)' },
  profiled: { icon: Search, color: 'var(--app-faint)' },
  drafted: { icon: PenLine, color: 'var(--app-accent-fg)' },
  sent: { icon: Send, color: 'var(--app-success-fg)' },
  reply: { icon: MessageSquare, color: 'var(--app-success-fg)' },
};

const DEFAULT_META: ActivityMeta = { icon: Activity, color: 'var(--app-faint)' };

type NotificationPanelProps = Readonly<{
  items: ReadonlyArray<ActivityItemDto>;
  onOpenLead: (leadId: string) => void;
}>;

const NotificationPanel = ({ items, onOpenLead }: NotificationPanelProps) => (
  <div className="absolute right-0 top-[46px] z-20 w-[340px] overflow-hidden rounded-2xl border border-app-line bg-app-raised shadow-[0_24px_60px_-20px_var(--app-drop)]">
    <div className="border-b border-app-line px-4 py-3 text-[11px] uppercase tracking-[0.06em] text-app-faint">
      Activity
    </div>
    <div className="max-h-[380px] overflow-y-auto">
      {items.length === 0 && (
        <div className="px-4 py-8 text-center text-[13px] text-app-faint">
          Nothing yet tonight.
        </div>
      )}
      {items.map((item) => {
        const meta = TYPE_META[item.type] ?? DEFAULT_META;
        const Icon = meta.icon;
        return (
          <button
            key={item.id}
            type="button"
            disabled={item.leadId === null}
            onClick={() => item.leadId && onOpenLead(item.leadId)}
            className="flex w-full items-start gap-3 border-b border-app-line px-4 py-3 text-left last:border-0 enabled:cursor-pointer enabled:hover:bg-app-hover"
          >
            <span
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${meta.color}22`, color: meta.color }}
            >
              <Icon size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-app-fg">{item.title}</div>
              <div className="text-[11px] text-app-faint">{relativeTime(item.createdAt)}</div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default NotificationPanel;
