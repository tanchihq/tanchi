import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { editOneSenderAxios } from '@/api/api';
import { SenderErrors } from '@/api/senders/entities/errors';
import { type EditSenderDto } from '@/api/senders/entities/request.entities';
import { type SenderDto } from '@/api/senders/entities/response.entities';

type UseEditSenderProps = Readonly<{ onEdited: (sender: SenderDto) => void }>;

type EditSenderPayload = Readonly<{ id: string; dto: EditSenderDto }>;

const useEditSender = ({ onEdited }: UseEditSenderProps) =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case SenderErrors.invalidFromEmail:
          toast.error('Invalid sender email.');
          break;
        case SenderErrors.invalidHost:
          toast.error('Invalid SMTP/IMAP host.');
          break;
        case SenderErrors.invalidPort:
          toast.error('Invalid port.');
          break;
        case SenderErrors.invalidSecret:
          toast.error('Invalid password.');
          break;
        case SenderErrors.invalidSignature:
          toast.error('Signature is too long.');
          break;
        case SenderErrors.inexistingSender:
          toast.error('This mailbox no longer exists.');
          break;
        case SenderErrors.notInMyOrg:
          toast.error("You can't edit this mailbox.");
          break;
        default:
          toast.error("Couldn't save the changes, check the fields.");
      }
    },
    onSuccess: ({ returnedData }) => onEdited(returnedData),
    promise: ({ id, dto }: EditSenderPayload) => editOneSenderAxios(id, dto),
  });

export default useEditSender;
