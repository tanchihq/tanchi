import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useRunEngine from './hooks/useRunEngine';

const EnginePreparationCard = () => {
  const { onFetch, isLoading } = useRunEngine();

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
        Next preparation
      </div>
      <div className="text-[13px] leading-snug text-[#ABA8C0]">
        Tonight the agent sources new prospects and drafts messages.
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2.5 w-full"
        isLoading={isLoading}
        onClick={() => onFetch()}
      >
        {!isLoading && <Play size={12} />}
        Run now
      </Button>
    </div>
  );
};

export default EnginePreparationCard;
