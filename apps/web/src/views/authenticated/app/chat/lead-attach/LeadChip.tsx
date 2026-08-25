import { X } from 'lucide-react';
import { type ChatLeadDto } from '@/api/chat/entities/response.entities';

type LeadChipProps = Readonly<{
  lead: ChatLeadDto;
  onRemove: (leadId: string) => void;
}>;

const LeadChip = ({ lead, onRemove }: LeadChipProps) => (
  <span className="flex items-center gap-1.5 rounded-full border border-app-line bg-app-hover py-1 pl-3 pr-1.5 text-[12px] text-app-soft">
    <span className="truncate">
      {lead.name} <span className="text-app-faint">· {lead.company}</span>
    </span>
    <button
      type="button"
      onClick={() => onRemove(lead.leadId)}
      aria-label={`Remove ${lead.name}`}
      className="flex size-[18px] items-center justify-center rounded-full text-app-faint transition-colors hover:bg-app-hover hover:text-app-fg"
    >
      <X size={12} />
    </button>
  </span>
);

export default LeadChip;
