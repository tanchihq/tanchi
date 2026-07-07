import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import {
  contactProspectAxios,
  editQueueItemAxios,
  validateProspectAxios,
} from '@/api/api';
import { type Stage } from '@/api/shared/enums';
import { type LeadDetailDto } from '@/api/prospects/entities/response.entities';
import { type EditedDraft } from '../utils';

type SendDraftData = Readonly<{
  id: string;
  stage: Stage;
  edited: EditedDraft | null;
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
    promise: async ({ id, stage, edited, senderId }: SendDraftData): Promise<LeadDetailDto> => {
      if (edited !== null) {
        await editQueueItemAxios({
          id,
          message: edited.message,
          subject: edited.subject,
        });
      }
      return stage === 'identified'
        ? contactProspectAxios(id, senderId)
        : validateProspectAxios(id, senderId);
    },
  });

export default useSendDraft;
