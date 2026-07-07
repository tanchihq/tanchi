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
  run_started: { icon: Play, color: '#7c79f6' },
  run_done: { icon: Check, color: '#4ade80' },
  sourced: { icon: Search, color: '#8e8aa5' },
  profiled: { icon: Search, color: '#8e8aa5' },
  drafted: { icon: PenLine, color: '#7c79f6' },
  sent: { icon: Send, color: '#4ade80' },
  reply: { icon: MessageSquare, color: '#4ade80' },
};

const DEFAULT_META: ActivityMeta = { icon: Activity, color: '#8e8aa5' };

type NotificationPanelProps = Readonly<{
  items: ReadonlyArray<ActivityItemDto>;
  onOpenLead: (leadId: string) => void;
}>;

const NotificationPanel = ({ items, onOpenLead }: NotificationPanelProps) => (
  <div className="absolute right-0 top-[46px] z-20 w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-[#141330] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
    <div className="border-b border-white/8 px-4 py-3 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
      Activity
    </div>
    <div className="max-h-[380px] overflow-y-auto">
      {items.length === 0 && (
        <div className="px-4 py-8 text-center text-[13px] text-[#6F6C85]">
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
            className="flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-left last:border-0 enabled:cursor-pointer enabled:hover:bg-white/[0.03]"
          >
            <span
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${meta.color}22`, color: meta.color }}
            >
              <Icon size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-[#F3F2F8]">{item.title}</div>
              <div className="text-[11px] text-[#6F6C85]">{relativeTime(item.createdAt)}</div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default NotificationPanel;
