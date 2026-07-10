import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { attachChatLeadAxios } from '@/api/api';
import { type ChatLeadDto } from '@/api/chat/entities/response.entities';

type UseAttachLeadProps = Readonly<{ onAttached: (lead: ChatLeadDto) => void }>;

type AttachLeadPayload = Readonly<{ id: string; leadId: string }>;

const useAttachLead = ({ onAttached }: UseAttachLeadProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't attach the lead, please try again."),
    onSuccess: ({ returnedData }) => onAttached(returnedData),
    promise: ({ id, leadId }: AttachLeadPayload) =>
      attachChatLeadAxios(id, { leadId }),
  });

export default useAttachLead;
