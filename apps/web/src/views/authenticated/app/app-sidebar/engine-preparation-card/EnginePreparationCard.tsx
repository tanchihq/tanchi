import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStatus } from '../../store/app-status.context';
import useRunEngine from './hooks/useRunEngine';

const EnginePreparationCard = () => {
  const { notifyRunStarted, refetch } = useAppStatus();
  const { onFetch, isLoading } = useRunEngine({ onDone: refetch });

  const run = () => {
    notifyRunStarted();
    onFetch();
  };

  return (
    <div className="rounded-xl border border-app-line bg-app-hover p-3">
      <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-app-faint">
        Next preparation
      </div>
      <div className="text-[13px] leading-snug text-app-soft">
        Tonight the agent sources new prospects and drafts messages.
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2.5 w-full"
        isLoading={isLoading}
        onClick={run}
      >
        {!isLoading && <Play size={12} />}
        Run now
      </Button>
    </div>
  );
};

export default EnginePreparationCard;
