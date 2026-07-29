import { useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { type Stage } from '@/api/shared/enums';
import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import {
  BOARD_STAGES,
  EMPTY_HINT,
  SIDE_STAGES,
} from '@/utils/prospect-display';
import { isDueToday } from '@/utils/format';
import { AppScreen } from '../AppScreen';
import { AppEmpty, AppError, AppLoader } from '@/components/AsyncState';
import PipelineColumn from './pipeline-column/PipelineColumn';
import CollapsibleStage from './collapsible-stage/CollapsibleStage';
import useRetrieveProspects from './hooks/useRetrieveProspects';
import useMoveStage from './hooks/useMoveStage';
import { needsTonight } from './utils';

const Pipeline = () => {
  const navigate = useNavigate();
  const { data, status, refetch } = useRetrieveProspects();
  const { onFetch: move } = useMoveStage({ onMoved: refetch });

  const [tonight, setTonight] = useState(false);
  const [marketFilter, setMarketFilter] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  if (status === 'loading') {
    return (
      <AppScreen title="Pipeline">
        <AppLoader />
      </AppScreen>
    );
  }
  if (status === 'error') {
    return (
      <AppScreen title="Pipeline">
        <AppError onRetry={refetch} />
      </AppScreen>
    );
  }

  const prospects = data ?? [];

  if (prospects.length === 0) {
    return (
      <AppScreen title="Pipeline">
        <AppEmpty
          icon={<Sparkles size={22} />}
          title="No prospects yet"
          hint="Tonight the agent sources new prospects on your ICPs. Run it now from the sidebar to see them here."
        />
      </AppScreen>
    );
  }

  const inBoard = (prospect: ProspectDto): boolean =>
    tonight ? needsTonight(prospect) : true;

  const marketNames = Array.from(
    new Set(prospects.map((prospect) => prospect.market).filter((market) => market !== '')),
  );
  const visibleProspects =
    marketFilter === null
      ? prospects
      : prospects.filter((prospect) => prospect.market === marketFilter);

  const drop = (stage: Stage) => {
    if (draggingId !== null) move({ id: draggingId, stage, origin: 'manual' });
    setDraggingId(null);
    setDragOver(null);
  };

  const allowDrop = (stage: Stage) => (event: DragEvent) => {
    event.preventDefault();
    if (dragOver !== stage) setDragOver(stage);
  };

  const open = (id: string) => navigate(`/app/lead/${id}`);

  return (
    <AppScreen title="Pipeline">
      <div className="flex h-full flex-col gap-3 px-[22px] pb-[18px] pt-4">
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTonight((value) => !value)}
            className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[9px] border px-3.5 text-[13px] transition-colors"
            style={{
              borderColor: tonight ? 'rgba(124,121,246,0.5)' : 'rgba(255,255,255,0.1)',
              background: tonight ? 'rgba(5,1,240,0.2)' : 'rgba(255,255,255,0.04)',
              color: tonight ? '#A9A6FF' : '#ABA8C0',
            }}
          >
            <span
              className="size-[7px] rounded-full"
              style={{ background: tonight ? '#7c79f6' : '#6f6c85' }}
            />
            To handle tonight
          </button>
          <span className="text-xs text-[#6F6C85]">
            {tonight ? 'drafts, replies and follow-ups due today' : 'all stages'}
          </span>
          {marketNames.length > 1 && (
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMarketFilter(null)}
                className="flex h-[34px] cursor-pointer items-center rounded-[9px] border px-3 text-[13px] transition-colors"
                style={{
                  borderColor: marketFilter === null ? 'rgba(124,121,246,0.5)' : 'rgba(255,255,255,0.1)',
                  background: marketFilter === null ? 'rgba(5,1,240,0.2)' : 'rgba(255,255,255,0.04)',
                  color: marketFilter === null ? '#A9A6FF' : '#ABA8C0',
                }}
              >
                All markets
              </button>
              {marketNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setMarketFilter(name)}
                  className="flex h-[34px] cursor-pointer items-center rounded-[9px] border px-3 text-[13px] transition-colors"
                  style={{
                    borderColor: marketFilter === name ? 'rgba(124,121,246,0.5)' : 'rgba(255,255,255,0.1)',
                    background: marketFilter === name ? 'rgba(5,1,240,0.2)' : 'rgba(255,255,255,0.04)',
                    color: marketFilter === name ? '#A9A6FF' : '#ABA8C0',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-0.5">
          {BOARD_STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              cards={visibleProspects.filter(
                (prospect) => prospect.stage === stage && inBoard(prospect),
              )}
              due={
                stage === 'following-up'
                  ? visibleProspects.filter(
                      (prospect) =>
                        prospect.stage === 'following-up' &&
                        isDueToday(prospect.nextFollowUpAt),
                    ).length
                  : 0
              }
              over={dragOver === stage}
              emptyHint={tonight ? 'Nothing to handle here' : EMPTY_HINT[stage]}
              draggingId={draggingId}
              onDragOver={allowDrop(stage)}
              onDrop={() => drop(stage)}
              onOpen={open}
              onDragStart={setDraggingId}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOver(null);
              }}
              onQualify={(id, next) => move({ id, stage: next, origin: 'manual' })}
              onExcluded={refetch}
            />
          ))}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {SIDE_STAGES.map((stage) => (
            <CollapsibleStage
              key={stage}
              stage={stage}
              prospects={visibleProspects.filter((prospect) => prospect.stage === stage)}
              over={dragOver === stage}
              onDragOver={allowDrop(stage)}
              onDrop={() => drop(stage)}
              onOpen={open}
              onMove={(id, next) => move({ id, stage: next, origin: 'manual' })}
              onExcluded={refetch}
            />
          ))}
        </div>
      </div>
    </AppScreen>
  );
};

export default Pipeline;
