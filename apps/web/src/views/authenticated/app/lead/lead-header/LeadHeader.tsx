import { ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Stage } from '@/api/shared/enums';
import { BOARD_STAGES, STAGE_LABEL } from '@/utils/prospect-display';

type LeadHeaderProps = Readonly<{
  stage: Stage;
  index: number;
  orderLength: number;
  onBack: () => void;
  onStage: (stage: Stage) => void;
  onPrev: () => void;
  onNext: () => void;
}>;

const LeadHeader = ({
  stage,
  index,
  orderLength,
  onBack,
  onStage,
  onPrev,
  onNext,
}: LeadHeaderProps) => (
  <header className="bg-night-700/55 flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-6 py-3 backdrop-blur-[22px]">
    <Button variant="outline" size="sm" className="h-[34px]" onClick={onBack}>
      <ArrowLeft size={15} /> Pipeline
    </Button>
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-1.5 lg:flex">
        {BOARD_STAGES.map((boardStage) => {
          const active = boardStage === stage;
          return (
            <button
              key={boardStage}
              type="button"
              onClick={() => onStage(boardStage)}
              className="h-7 cursor-pointer whitespace-nowrap rounded-md border px-2.5 text-[11.5px] transition-colors"
              style={{
                borderColor: active ? 'rgba(124,121,246,0.5)' : 'rgba(255,255,255,0.08)',
                background: active ? 'rgba(5,1,240,0.22)' : 'transparent',
                color: active ? '#F3F2F8' : '#6f6c85',
              }}
            >
              {STAGE_LABEL[boardStage]}
            </button>
          );
        })}
      </div>
      <div className="mx-1 h-[22px] w-px bg-white/10" />
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        disabled={index <= 0}
        onClick={onPrev}
      >
        <ArrowUp size={15} />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        disabled={index < 0 || index >= orderLength - 1}
        onClick={onNext}
      >
        <ArrowDown size={15} />
      </Button>
    </div>
  </header>
);

export default LeadHeader;
