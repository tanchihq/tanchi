import { Badge } from '@/components/ui/badge';
import { ChannelIcon } from '@/components/ChannelIcon';
import {
  type MessageHistoryDto,
  type MessageStatus,
} from '@/api/messages/entities/response.entities';

const STATUS_VARIANT: Readonly<
  Record<MessageStatus, 'success' | 'brand' | 'neutral' | 'warning'>
> = {
  sent: 'success',
  edited: 'brand',
  draft: 'neutral',
  skipped: 'warning',
};

const dayLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

type MessageRowProps = Readonly<{
  message: MessageHistoryDto;
  onOpen: (leadId: string) => void;
}>;

const MessageRow = ({ message, onOpen }: MessageRowProps) => (
  <button
    type="button"
    onClick={() => onOpen(message.leadId)}
    className="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-app-line bg-app-surface p-[14px_18px] text-left transition-colors hover:border-app-accent-line"
  >
    <ChannelIcon channel={message.channel} size={16} className="text-app-faint shrink-0" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="truncate text-sm font-medium text-app-fg">
          {message.prospectName}
        </span>
        <span className="truncate text-xs text-app-faint">{message.company}</span>
      </div>
      <div className="truncate text-xs text-app-faint">
        {message.subject ?? message.body}
      </div>
    </div>
    <Badge variant={STATUS_VARIANT[message.status]}>{message.status}</Badge>
    <span className="w-12 shrink-0 text-right text-[11px] text-app-faint">
      {dayLabel(message.sentAt ?? message.createdAt)}
    </span>
  </button>
);

export default MessageRow;
