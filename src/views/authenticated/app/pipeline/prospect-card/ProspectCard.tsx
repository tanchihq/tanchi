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
      className="group cursor-pointer rounded-xl border border-white/8 bg-[#1B1B3B] p-[10px_11px] shadow-[0_8px_20px_-14px_rgba(0,0,0,0.7)] transition-colors hover:border-brand-400/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-medium text-[#ABA8C0]">
            {initialsOf(prospect.firstName, prospect.lastName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] tracking-tight text-[#F3F2F8]">
                {fullName(prospect.firstName, prospect.lastName)}
              </span>
              {prospect.hot && (
                <span
                  className="bg-brand-400 size-1.5 shrink-0 rounded-full"
                  style={{ boxShadow: '0 0 0 3px rgba(124,121,246,0.16)' }}
                />
              )}
            </div>
            <div className="truncate text-[11px] text-[#6F6C85]">{prospect.company}</div>
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
            className="flex size-[18px] items-center justify-center rounded-md text-[#6F6C85] opacity-0 transition-all hover:bg-white/[0.07] hover:text-[#ff8a80] focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Ban size={12} />
          </button>
          <span
            title={prospect.origin === 'auto' ? 'moved automatically' : 'moved by you'}
            className="flex size-[18px] items-center justify-center rounded-md"
            style={{
              background:
                prospect.origin === 'auto' ? 'rgba(5,1,240,0.22)' : 'rgba(255,255,255,0.07)',
            }}
          >
            {prospect.origin === 'auto' ? (
              <Sparkles size={11} className="text-brand-400" fill="currentColor" />
            ) : (
              <Navigation size={11} className="text-glass-dim" />
            )}
          </span>
        </div>
      </div>

      <div className="mt-[9px] flex items-center gap-[7px]">
        <ChannelIcon channel={prospect.channel} size={13} className="text-glass-dim" />
        <span className="max-w-[108px] truncate rounded-md border border-white/8 bg-white/5 px-[7px] py-[2px] text-[10.5px] text-[#ABA8C0]">
          {prospect.icp}
        </span>
        <span className="ml-auto whitespace-nowrap text-[11px] text-[#6F6C85]">
          {ageLabel(prospect.createdAt)}
        </span>
      </div>

      {follow &&
        (prospect.stage === 'contacted' || prospect.stage === 'following-up') && (
          <div
            className="mt-2 flex items-center gap-1 text-[11px]"
            style={{ color: follow === 'today' || follow === 'overdue' ? '#7c79f6' : '#6f6c85' }}
          >
            <RotateCcw size={11} /> next follow-up {follow}
          </div>
        )}

      {prospect.stage === 'replied' && (
        <div
          className="mt-[9px] flex gap-1.5 border-t border-white/8 pt-[9px]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onQualify('meeting')}
            className="border-brand-400/40 bg-brand-600/20 text-brand-300 h-7 flex-1 cursor-pointer rounded-md border text-[11px] font-medium"
          >
            positive
          </button>
          <button
            type="button"
            onClick={() => onQualify('not-interested')}
            className="h-7 flex-1 cursor-pointer rounded-md border border-white/8 bg-white/[0.04] text-[11px] text-[#ABA8C0]"
          >
            negative
          </button>
          <button
            type="button"
            onClick={() => onQualify('snoozed')}
            className="h-7 flex-1 cursor-pointer rounded-md border border-white/8 bg-white/[0.04] text-[11px] text-[#ABA8C0]"
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
