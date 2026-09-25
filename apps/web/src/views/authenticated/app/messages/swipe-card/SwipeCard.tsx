import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChannelIcon } from '@/components/ChannelIcon';
import { type QueueItemDto } from '@/api/queue/entities/response.entities';
import { fullName } from '../utils';
import WhyNow from './why-now/WhyNow';
import PreviousMessage from './previous-message/PreviousMessage';
import DraftEditor from './draft-editor/DraftEditor';
import { type DraftFormValues } from './draft-editor/utils';
import { identityLine, recipientLine, scoreLabel } from './utils';

type Properties = Readonly<{
  item: QueueItemDto;
  editing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: DraftFormValues) => void;
}>;

const SwipeCard = ({
  item,
  editing,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
}: Properties) => {
  const score = scoreLabel(item);
  const identity = identityLine(item);

  return (
    <article className="h-full overflow-y-auto">
      <div className="flex min-h-full flex-col gap-3 p-[20px_22px]">
        <header className="flex items-start gap-3">
          <div className="border-app-line bg-app-hover text-app-soft flex size-10 shrink-0 items-center justify-center rounded-xl border">
            <ChannelIcon channel={item.channel} size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-app-fg truncate text-[16px] font-medium tracking-tight">
              {fullName(item)}
            </div>
            {identity !== '' && (
              <div className="text-app-faint truncate text-[12.5px]">
                {identity}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <Badge variant="neutral">
              {item.kind === 'follow-up'
                ? `Follow-up #${item.followUpNumber}`
                : 'First message'}
            </Badge>
            {score !== null && <Badge variant="brand">{score}</Badge>}
            {item.autoSend && (
              <Badge
                variant="success"
                title="Goes out on its own during business hours"
              >
                <Zap size={11} /> Auto
              </Badge>
            )}
          </div>
        </header>

        <WhyNow angle={item.chosenAngle} fallbackFact={item.facts[0] ?? null} />

        {item.previousMessage !== null && (
          <PreviousMessage
            message={item.previousMessage}
            followUpNumber={item.followUpNumber}
          />
        )}

        <section className="flex min-h-[200px] flex-1 flex-col">
          <div className="text-app-faint mb-1.5 flex items-center justify-between text-[11px] tracking-[0.06em] uppercase">
            <span className="truncate">{recipientLine(item)}</span>
            {item.status === 'edited' && (
              <span className="text-app-accent-fg normal-case tracking-normal">
                edited
              </span>
            )}
          </div>
          {editing ? (
            <DraftEditor
              item={item}
              saving={saving}
              onSave={onSave}
              onCancel={onCancelEdit}
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={onStartEdit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onStartEdit();
              }}
              title="Click to edit"
              className="border-app-line bg-app-well hover:border-app-accent-line flex-1 cursor-text rounded-xl border p-[14px_16px] transition-colors"
            >
              {item.subject !== null && item.subject !== '' && (
                <div className="text-app-fg mb-2 text-[13.5px] font-medium">
                  {item.subject}
                </div>
              )}
              <div className="text-app-fg text-[13.5px] leading-relaxed whitespace-pre-wrap">
                {item.message}
              </div>
            </div>
          )}
        </section>
      </div>
    </article>
  );
};

export default SwipeCard;
