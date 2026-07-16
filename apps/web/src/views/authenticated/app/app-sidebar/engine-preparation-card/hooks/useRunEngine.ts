import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { runEngineAxios } from '@/api/api';
import { EngineErrors, type EngineRunSummaryDto } from '@/api/engine';

type UseRunEngineProps = Readonly<{ onDone: () => void }>;

const useRunEngine = ({ onDone }: UseRunEngineProps) =>
  useAsyncEvent<EngineRunSummaryDto, void>({
    onError: ({ error }) => {
      switch (error.message) {
        case EngineErrors.noIcps:
          toast.error('Configure at least one ICP in Settings first.');
          break;
        case EngineErrors.subscriptionExpired:
          toast.error('Your trial has ended. Subscribe in Settings to keep going.');
          break;
        default:
          toast.error("Couldn't run the engine, please try again.");
      }
    },
    onSuccess: () => {
      onDone();
      toast.success(`Engine started, you will be notified when it's done.`);
    },
    promise: () => runEngineAxios(),
  });

export default useRunEngine;
