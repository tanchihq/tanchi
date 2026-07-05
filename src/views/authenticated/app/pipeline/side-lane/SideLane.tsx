import { type DragEvent } from 'react';
import { type Stage } from '@/api/shared/enums';
import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import { ChannelIcon } from '@/components/ChannelIcon';
import { STAGE_LABEL } from '@/utils/prospect-display';
import { fullName, monthLabel } from '@/utils/format';

type SideLaneProps = Readonly<{
  stage: Stage;
  cards: ReadonlyArray<ProspectDto>;
  over: boolean;
  emptyHint: string;
  draggingId: string | null;
  onDragOver: (event: DragEvent) => void;
  onDrop: () => void;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}>;

const SideLane = ({
  stage,
  cards,
  over,
  emptyHint,
  draggingId,
  onDragOver,
  onDrop,
  onOpen,
  onDragStart,
  onDragEnd,
}: SideLaneProps) => (
  <div
    onDragOver={onDragOver}
    onDrop={onDrop}
    className="min-w-0 flex-1 rounded-[13px] border border-dashed px-[13px] py-2.5"
    style={{
      background: over ? 'rgba(5,1,240,0.12)' : 'rgba(255,255,255,0.02)',
      borderColor: over ? 'rgba(124,121,246,0.5)' : 'rgba(255,255,255,0.08)',
    }}
  >
    <div className="mb-[9px] flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
        {STAGE_LABEL[stage]}
      </span>
      <span className="text-[11px] text-[#6F6C85]">{cards.length}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {cards.map((prospect) => {
        const wake = monthLabel(prospect.snoozeUntil);
        return (
          <div
            key={prospect.id}
            draggable
            onClick={() => onOpen(prospect.id)}
            onDragStart={() => onDragStart(prospect.id)}
            onDragEnd={onDragEnd}
            style={{ opacity: draggingId === prospect.id ? 0.4 : 1 }}
            className="min-w-[156px] cursor-pointer rounded-[10px] border border-white/[0.07] bg-[#16162F] px-2.5 py-2"
          >
            <div className="flex items-center gap-[7px]">
              <span className="truncate text-[12.5px] text-[#ABA8C0]">
                {fullName(prospect.firstName, prospect.lastName)}
              </span>
              <ChannelIcon
                channel={prospect.channel}
                size={13}
                className="text-glass-dim ml-auto"
              />
            </div>
            <div className="mt-0.5 text-[11px] text-[#6F6C85]">{prospect.company}</div>
            {wake && <div className="text-brand-400 mt-1 text-[10.5px]">wake {wake}</div>}
          </div>
        );
      })}
      {cards.length === 0 && (
        <span className="text-[11.5px] text-[#6F6C85]">{emptyHint}</span>
      )}
    </div>
  </div>
);

export default SideLane;
