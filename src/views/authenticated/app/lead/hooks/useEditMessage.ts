import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { editMessageAxios } from '@/api/api';
import { MessageErrors } from '@/api/messages/entities/errors';
import { type EditMessageDto } from '@/api/messages/entities/request.entities';
import { type EditMessageResultDto } from '@/api/messages/entities/response.entities';

type UseEditMessageProps = Readonly<{ onSaved: (result: EditMessageResultDto) => void }>;

type EditMessagePayload = Readonly<{ id: string; dto: EditMessageDto }>;

const useEditMessage = ({ onSaved }: UseEditMessageProps) =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case MessageErrors.notEditable:
          toast.error('This message was already sent — it can no longer be edited.');
          break;
        case MessageErrors.invalidBody:
          toast.error('The message body cannot be empty.');
          break;
        case MessageErrors.invalidSubject:
          toast.error('Subject is too long.');
          break;
        case MessageErrors.inexistingMessage:
          toast.error('This message no longer exists.');
          break;
        default:
          toast.error("Couldn't save the message, please try again.");
      }
    },
    onSuccess: ({ returnedData }) => {
      onSaved(returnedData);
      toast.success('Draft saved. Your edits train the AI over time.');
    },
    promise: ({ id, dto }: EditMessagePayload) => editMessageAxios(id, dto),
  });

export default useEditMessage;
