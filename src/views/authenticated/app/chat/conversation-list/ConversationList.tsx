import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/lib/utils';
import { type ChatConversationSummaryDto } from '@/api/chat/entities/response.entities';
import { conversationTime, conversationTitle } from '../utils';

type ConversationListProps = Readonly<{
  conversations: ReadonlyArray<ChatConversationSummaryDto>;
  activeId: string | undefined;
  creating: boolean;
  deletingId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}>;

const ConversationList = ({
  conversations,
  activeId,
  creating,
  deletingId,
  onNew,
  onSelect,
  onDelete,
}: ConversationListProps) => (
  <aside className="flex w-[262px] shrink-0 flex-col border-r border-white/8 bg-[#13132B]/60">
    <div className="p-3">
      <Button className="w-full" isLoading={creating} onClick={onNew}>
        {!creating && <Plus size={16} />}
        New conversation
      </Button>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      {conversations.length === 0 ? (
        <div className="px-3 py-6 text-center text-[12.5px] leading-relaxed text-[#6F6C85]">
          No conversation yet. Start one to chat with the copilot about your prospects.
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-[9px] px-3 py-2 transition-colors',
                conversation.id === activeId
                  ? 'bg-brand-600/[0.16]'
                  : 'hover:bg-white/[0.05]',
              )}
            >
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    'truncate text-[13px] tracking-tight',
                    conversation.id === activeId ? 'text-[#F3F2F8]' : 'text-[#ABA8C0]',
                  )}
                >
                  {conversationTitle(conversation.title)}
                </div>
                <div className="text-[11px] text-[#6F6C85]">
                  {conversationTime(conversation.updatedAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(conversation.id);
                }}
                aria-label="Delete conversation"
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md text-[#6F6C85] transition-all hover:bg-white/[0.07] hover:text-[#ff8a80]',
                  deletingId === conversation.id
                    ? 'opacity-100'
                    : 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100',
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </aside>
);

export default ConversationList;
