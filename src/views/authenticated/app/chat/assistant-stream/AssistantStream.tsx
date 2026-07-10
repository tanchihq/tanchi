import { Check, Loader2, Sparkles } from 'lucide-react';
import Markdown from '@/components/Markdown';
import { type ChatActionName } from '@/api/chat/entities/response.entities';
import { actionLabel } from '../utils';

type AssistantStreamProps = Readonly<{
  actions: ReadonlyArray<ChatActionName>;
  text: string | null;
}>;

const AssistantStream = ({ actions, text }: AssistantStreamProps) => {
  const done = text !== null;

  return (
    <div className="flex justify-start gap-2.5">
      <div className="bg-brand-600/[0.18] text-brand-300 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
        <Sparkles size={14} />
      </div>
      <div className="max-w-[80%] rounded-2xl border border-white/[0.07] bg-[#171733] px-[15px] py-2.5 text-[13.5px] leading-relaxed text-[#E7E6F0]">
        {actions.length > 0 && (
          <div className="mb-2 flex flex-col gap-1">
            {actions.map((name, index) => (
              <div
                key={`${name}-${index}`}
                className="flex items-center gap-1.5 text-[12px] text-[#8F8CA6]"
              >
                {done ? (
                  <Check size={12} className="text-success shrink-0" />
                ) : (
                  <Loader2 size={12} className="shrink-0 animate-spin" />
                )}
                {actionLabel(name)}
              </div>
            ))}
          </div>
        )}

        {done ? (
          <Markdown content={text} />
        ) : (
          actions.length === 0 && (
            <span className="text-glass-dim inline-flex gap-1">
              <span className="animate-pulse">•</span>
              <span className="animate-pulse [animation-delay:150ms]">•</span>
              <span className="animate-pulse [animation-delay:300ms]">•</span>
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default AssistantStream;
