import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { runEngineAxios } from '@/api/api';
import { EngineErrors, type EngineRunSummaryDto } from '@/api/engine';

const useRunEngine = () =>
  useAsyncEvent<EngineRunSummaryDto, void>({
    onError: ({ error }) => {
      switch (error.message) {
        case EngineErrors.noIcps:
          toast.error('Configure at least one ICP in Settings first.');
          break;
        default:
          toast.error("Couldn't run the engine, please try again.");
      }
    },
    onSuccess: ({ returnedData }) =>
      toast.success(
        `Engine done · ${returnedData.sourced} sourced, ${returnedData.drafted} drafted.`,
      ),
    promise: () => runEngineAxios(),
  });

export default useRunEngine;
