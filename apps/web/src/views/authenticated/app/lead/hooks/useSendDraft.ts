import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { contactProspectAxios, validateProspectAxios } from '@/api/api';
import { type Stage } from '@/api/shared/enums';
import { type LeadDetailDto } from '@/api/prospects/entities/response.entities';

type SendDraftData = Readonly<{
  id: string;
  stage: Stage;
  senderId?: string;
}>;

type UseSendDraftProps = Readonly<{ onDone: () => void }>;

const useSendDraft = ({ onDone }: UseSendDraftProps) =>
  useAsyncEvent({
    onError: ({ error }) =>
      toast.error(
        error.message === 'noSender'
          ? 'Connect a mailbox first (Mailbox tab).'
          : "Couldn't send, please try again.",
      ),
    onSuccess: () => {
      onDone();
      toast.success('Message sent.');
    },
    promise: async ({ id, stage, senderId }: SendDraftData): Promise<LeadDetailDto> =>
      stage === 'identified'
        ? contactProspectAxios(id, senderId)
        : validateProspectAxios(id, senderId),
  });

export default useSendDraft;
