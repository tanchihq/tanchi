import { X } from 'lucide-react';
import { type ChatLeadDto } from '@/api/chat/entities/response.entities';

type LeadChipProps = Readonly<{
  lead: ChatLeadDto;
  onRemove: (leadId: string) => void;
}>;

const LeadChip = ({ lead, onRemove }: LeadChipProps) => (
  <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.05] py-1 pl-3 pr-1.5 text-[12px] text-[#D9D7E4]">
    <span className="truncate">
      {lead.name} <span className="text-[#6F6C85]">· {lead.company}</span>
    </span>
    <button
      type="button"
      onClick={() => onRemove(lead.leadId)}
      aria-label={`Remove ${lead.name}`}
      className="flex size-[18px] items-center justify-center rounded-full text-[#6F6C85] transition-colors hover:bg-white/10 hover:text-white"
    >
      <X size={12} />
    </button>
  </span>
);

export default LeadChip;
