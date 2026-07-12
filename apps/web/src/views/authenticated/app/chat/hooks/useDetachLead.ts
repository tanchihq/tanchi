import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { detachChatLeadAxios } from '@/api/api';

type UseDetachLeadProps = Readonly<{ onDetached: (leadId: string) => void }>;

type DetachLeadPayload = Readonly<{ id: string; leadId: string }>;

const useDetachLead = ({ onDetached }: UseDetachLeadProps) =>
  useAsyncEvent({
    onError: () => toast.error("Couldn't remove the lead, please try again."),
    onSuccess: ({ data }) => onDetached(data.leadId),
    promise: ({ id, leadId }: DetachLeadPayload) => detachChatLeadAxios(id, leadId),
  });

export default useDetachLead;
