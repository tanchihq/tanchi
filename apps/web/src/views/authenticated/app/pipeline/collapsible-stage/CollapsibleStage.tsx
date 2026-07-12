import { useState, type DragEvent } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { type Stage } from '@/api/shared/enums';
import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/lib/utils';
import { STAGE_LABEL } from '@/utils/prospect-display';
import StageRow from './StageRow';
import {
  byCreatedDesc,
  bySnoozeAsc,
  isSnoozeExpired,
  matchesQuery,
  readSectionExpanded,
  writeSectionExpanded,
} from './utils';

type CollapsibleStageProps = Readonly<{
  stage: Stage;
  prospects: ReadonlyArray<ProspectDto>;
  over: boolean;
  onDragOver: (event: DragEvent) => void;
  onDrop: () => void;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: Stage) => void;
  onExcluded: () => void;
}>;

const CollapsibleStage = ({
  stage,
  prospects,
  over,
  onDragOver,
  onDrop,
  onOpen,
  onMove,
  onExcluded,
}: CollapsibleStageProps) => {
  const [expanded, setExpanded] = useState(() => readSectionExpanded(stage));
  const [query, setQuery] = useState('');

  const isSnoozed = stage === 'snoozed';
  const toWakeCount = isSnoozed
    ? prospects.filter((prospect) => isSnoozeExpired(prospect.snoozeUntil)).length
    : 0;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    writeSectionExpanded(stage, next);
  };

  const filtered = prospects.filter((prospect) => matchesQuery(prospect, query));
  const sorted = isSnoozed
    ? [...filtered].sort(bySnoozeAsc)
    : [...filtered].sort(byCreatedDesc);
  const toWake = isSnoozed
    ? sorted.filter((prospect) => isSnoozeExpired(prospect.snoozeUntil))
    : [];
  const rest = isSnoozed
    ? sorted.filter((prospect) => !isSnoozeExpired(prospect.snoozeUntil))
    : sorted;

  const renderRow = (prospect: ProspectDto, expired: boolean) => (
    <StageRow
      key={prospect.id}
      prospect={prospect}
      showWake={isSnoozed}
      expired={expired}
      onOpen={onOpen}
      onMove={onMove}
      onExcluded={onExcluded}
    />
  );

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="rounded-[13px] border border-dashed transition-colors"
      style={{
        background: over ? 'rgba(5,1,240,0.12)' : 'rgba(255,255,255,0.02)',
        borderColor: over ? 'rgba(124,121,246,0.5)' : 'rgba(255,255,255,0.08)',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-[14px] py-2.5 text-left"
      >
        <ChevronRight
          size={15}
          className={cn(
            'text-glass-dim shrink-0 transition-transform',
            expanded && 'rotate-90',
          )}
        />
        <span className="text-[13px] font-medium tracking-tight text-[#F3F2F8]">
          {STAGE_LABEL[stage]}
        </span>
        <span className="min-w-5 rounded-[9px] border border-white/8 bg-white/[0.06] px-[7px] text-center text-[11px] text-[#ABA8C0]">
          {prospects.length}
        </span>
        {toWakeCount > 0 && (
          <span className="text-warn rounded-[9px] bg-[rgba(251,191,119,0.14)] px-2 py-[1px] text-[11px] font-medium">
            {toWakeCount} to wake
          </span>
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 px-[14px] pb-3">
          {prospects.length > 6 && (
            <div className="relative">
              <Search
                size={14}
                className="text-glass-dim pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by name, company or ICP"
                className="h-8 pl-9 text-[12.5px]"
              />
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="rounded-[9px] border border-dashed border-white/10 px-3 py-5 text-center text-[12px] text-[#6F6C85]">
              {query.trim().length > 0 ? 'No match.' : `Nobody in ${STAGE_LABEL[stage]}.`}
            </div>
          ) : (
            <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto pr-0.5">
              {isSnoozed && toWake.length > 0 && (
                <>
                  <div className="text-warn px-1 pt-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em]">
                    To wake
                  </div>
                  {toWake.map((prospect) => renderRow(prospect, true))}
                  {rest.length > 0 && (
                    <div className="px-1 pt-1.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#6F6C85]">
                      Later
                    </div>
                  )}
                </>
              )}
              {rest.map((prospect) => renderRow(prospect, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollapsibleStage;
