import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { moveProspectStageAxios } from '@/api/api';

type UseMoveStageProps = Readonly<{ onMoved: () => void }>;

const useMoveStage = ({ onMoved }: UseMoveStageProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't move the prospect, please try again."),
    onSuccess: () => onMoved(),
    promise: moveProspectStageAxios,
  });

export default useMoveStage;
