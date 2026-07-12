import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/lib/utils';
import Markdown from '@/components/Markdown';
import { type ChatMessageRole } from '@/api/chat/entities/response.entities';

type MessageBubbleProps = Readonly<{
  role: ChatMessageRole;
  content: string;
  pending?: boolean;
}>;

const MessageBubble = ({ role, content, pending = false }: MessageBubbleProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="bg-brand-600/[0.18] text-brand-300 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
          <Sparkles size={14} />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-[15px] py-2.5 text-[13.5px] leading-relaxed',
          isUser
            ? 'whitespace-pre-wrap bg-brand-600 text-white'
            : 'border border-white/[0.07] bg-[#171733] text-[#E7E6F0]',
        )}
      >
        {pending ? (
          <span className="text-glass-dim inline-flex gap-1">
            <span className="animate-pulse">•</span>
            <span className="animate-pulse [animation-delay:150ms]">•</span>
            <span className="animate-pulse [animation-delay:300ms]">•</span>
          </span>
        ) : isUser ? (
          content
        ) : (
          <Markdown content={content} />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
