import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { createOneSenderAxios } from '@/api/api';
import { SenderErrors } from '@/api/senders/entities/errors';
import { type CreateSenderDto } from '@/api/senders/entities/request.entities';

type UseCreateSenderProps = Readonly<{ onCreated: () => void }>;

const useCreateSender = ({ onCreated }: UseCreateSenderProps) =>
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
        default:
          toast.error("Couldn't connect the mailbox, check the fields.");
      }
    },
    onSuccess: () => {
      onCreated();
      toast.success('Mailbox connected. Test it to activate.');
    },
    promise: (dto: CreateSenderDto) => createOneSenderAxios(dto),
  });

export default useCreateSender;
