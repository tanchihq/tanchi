import { useState, type DragEvent } from 'react';
import { Ban, Navigation, RotateCcw, Sparkles } from 'lucide-react';
import { type Stage } from '@/api/shared/enums';
import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import { ChannelIcon } from '@/components/ChannelIcon';
import { ageLabel, followUpLabel, fullName, initialsOf } from '@/utils/format';
import ExcludeDialog from '../exclude-dialog/ExcludeDialog';

type ProspectCardProps = Readonly<{
  prospect: ProspectDto;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onQualify: (stage: Stage) => void;
  onExcluded: () => void;
}>;

const ProspectCard = ({
  prospect,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onQualify,
  onExcluded,
}: ProspectCardProps) => {
  const [excludeOpen, setExcludeOpen] = useState(false);
  const follow = followUpLabel(prospect.nextFollowUpAt);

  return (
    <div
      draggable
      onClick={onOpen}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ opacity: dragging ? 0.4 : 1 }}
      className="group cursor-pointer rounded-xl border border-app-line bg-app-raised p-[10px_11px] shadow-[0_8px_20px_-14px_var(--app-drop)] transition-colors hover:border-app-accent-line"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-app-hover text-[11px] font-medium text-app-soft">
            {initialsOf(prospect.firstName, prospect.lastName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] tracking-tight text-app-fg">
                {fullName(prospect.firstName, prospect.lastName)}
              </span>
              {prospect.hot && (
                <span
                  className="bg-brand-400 size-1.5 shrink-0 rounded-full"
                  style={{ boxShadow: '0 0 0 3px var(--app-accent-line)' }}
                />
              )}
            </div>
            <div className="truncate text-[11px] text-app-faint">{prospect.company}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title="Exclude"
            aria-label="Exclude prospect"
            onClick={(event) => {
              event.stopPropagation();
              setExcludeOpen(true);
            }}
            className="flex size-[18px] items-center justify-center rounded-md text-app-faint opacity-0 transition-all hover:bg-app-hover hover:text-app-danger-fg focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Ban size={12} />
          </button>
          <span
            title={prospect.origin === 'auto' ? 'moved automatically' : 'moved by you'}
            className="flex size-[18px] items-center justify-center rounded-md"
            style={{
              background:
                prospect.origin === 'auto' ? 'var(--app-accent-bg)' : 'var(--app-hover)',
            }}
          >
            {prospect.origin === 'auto' ? (
              <Sparkles size={11} className="text-brand-400" fill="currentColor" />
            ) : (
              <Navigation size={11} className="text-app-faint" />
            )}
          </span>
        </div>
      </div>

      <div className="mt-[9px] flex items-center gap-[7px]">
        <ChannelIcon channel={prospect.channel} size={13} className="text-app-faint" />
        <span className="max-w-[108px] truncate rounded-md border border-app-line bg-app-hover px-[7px] py-[2px] text-[10.5px] text-app-soft">
          {prospect.icp}
        </span>
        <span className="ml-auto whitespace-nowrap text-[11px] text-app-faint">
          {ageLabel(prospect.createdAt)}
        </span>
      </div>

      {follow &&
        (prospect.stage === 'contacted' || prospect.stage === 'following-up') && (
          <div
            className="mt-2 flex items-center gap-1 text-[11px]"
            style={{ color: follow === 'today' || follow === 'overdue' ? 'var(--app-accent-fg)' : 'var(--app-faint)' }}
          >
            <RotateCcw size={11} /> next follow-up {follow}
          </div>
        )}

      {prospect.stage === 'replied' && (
        <div
          className="mt-[9px] flex gap-1.5 border-t border-app-line pt-[9px]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onQualify('meeting')}
            className="border-app-accent-line bg-app-accent-bg text-app-accent-fg h-7 flex-1 cursor-pointer rounded-md border text-[11px] font-medium"
          >
            positive
          </button>
          <button
            type="button"
            onClick={() => onQualify('not-interested')}
            className="h-7 flex-1 cursor-pointer rounded-md border border-app-line bg-app-hover text-[11px] text-app-soft"
          >
            negative
          </button>
          <button
            type="button"
            onClick={() => onQualify('snoozed')}
            className="h-7 flex-1 cursor-pointer rounded-md border border-app-line bg-app-hover text-[11px] text-app-soft"
          >
            later
          </button>
        </div>
      )}

      {excludeOpen && (
        <ExcludeDialog
          open
          onClose={() => setExcludeOpen(false)}
          prospectId={prospect.id}
          name={fullName(prospect.firstName, prospect.lastName)}
          company={prospect.company}
          onExcluded={() => {
            setExcludeOpen(false);
            onExcluded();
          }}
        />
      )}
    </div>
  );
};

export default ProspectCard;
