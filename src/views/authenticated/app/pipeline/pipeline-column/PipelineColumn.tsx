import { type DragEvent } from 'react';
import { type Stage } from '@/api/shared/enums';
import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import { STAGE_LABEL } from '@/utils/prospect-display';
import ProspectCard from '../prospect-card/ProspectCard';

type PipelineColumnProps = Readonly<{
  stage: Stage;
  cards: ReadonlyArray<ProspectDto>;
  due: number;
  over: boolean;
  emptyHint: string;
  draggingId: string | null;
  onDragOver: (event: DragEvent) => void;
  onDrop: () => void;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onQualify: (id: string, stage: Stage) => void;
  onExcluded: () => void;
}>;

const PipelineColumn = ({
  stage,
  cards,
  due,
  over,
  emptyHint,
  draggingId,
  onDragOver,
  onDrop,
  onOpen,
  onDragStart,
  onDragEnd,
  onQualify,
  onExcluded,
}: PipelineColumnProps) => (
  <div
    onDragOver={onDragOver}
    onDrop={onDrop}
    className="flex w-[236px] shrink-0 flex-col rounded-[14px] border backdrop-blur-[14px]"
    style={{
      background: over ? 'rgba(5,1,240,0.14)' : 'rgba(23,23,51,0.5)',
      borderColor: over ? 'rgba(124,121,246,0.55)' : 'rgba(255,255,255,0.06)',
    }}
  >
    <div className="flex items-center justify-between gap-2 px-[13px] pb-2.5 pt-3">
      <div className="flex items-center gap-[7px]">
        <span className="whitespace-nowrap text-[13px] font-medium tracking-tight text-[#F3F2F8]">
          {STAGE_LABEL[stage]}
        </span>
        <span className="min-w-5 rounded-[9px] border border-white/8 bg-white/[0.06] px-[7px] text-center text-[11px] text-[#ABA8C0]">
          {cards.length}
        </span>
      </div>
      {due > 0 && (
        <span className="text-brand-400 whitespace-nowrap text-[10.5px] font-medium">
          {due} due today
        </span>
      )}
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-3">
      {cards.map((prospect) => (
        <ProspectCard
          key={prospect.id}
          prospect={prospect}
          dragging={draggingId === prospect.id}
          onOpen={() => onOpen(prospect.id)}
          onDragStart={() => onDragStart(prospect.id)}
          onDragEnd={onDragEnd}
          onQualify={(next) => onQualify(prospect.id, next)}
          onExcluded={onExcluded}
        />
      ))}
      {cards.length === 0 && (
        <div className="rounded-[10px] border border-dashed border-white/10 px-2.5 py-4 text-center text-[11.5px] text-[#6F6C85]">
          {emptyHint}
        </div>
      )}
    </div>
  </div>
);

export default PipelineColumn;
