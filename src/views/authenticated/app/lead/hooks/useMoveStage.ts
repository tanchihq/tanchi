import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { moveProspectStageAxios } from '@/api/api';

type UseMoveStageProps = Readonly<{ onDone: () => void }>;

const useMoveStage = ({ onDone }: UseMoveStageProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't update the stage."),
    onSuccess: () => onDone(),
    promise: moveProspectStageAxios,
  });

export default useMoveStage;
