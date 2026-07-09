import { Building2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type SuppressionEntryDto } from '@/api/suppression/entities/response.entities';
import useReinstateExclusion from '../hooks/useReinstateExclusion';
import { dayLabel, entryLabel } from '../utils';

type ExclusionRowProps = Readonly<{
  entry: SuppressionEntryDto;
  onReinstated: () => void;
}>;

const ExclusionRow = ({ entry, onReinstated }: ExclusionRowProps) => {
  const { onFetch: reinstate, isLoading: reinstating } = useReinstateExclusion({
    onReinstated,
  });

  const isCompany = entry.scope === 'company';

  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="text-glass-dim flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
        {isCompany ? <Building2 size={15} /> : <User size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] text-[#F3F2F8]">{entryLabel(entry)}</span>
          <Badge variant="neutral">{isCompany ? 'Company' : 'Person'}</Badge>
        </div>
        <div className="truncate text-[11px] text-[#6F6C85]">
          {entry.reason ? entry.reason : 'No reason given'} · {dayLabel(entry.createdAt)}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        isLoading={reinstating}
        onClick={() => reinstate(entry.id)}
      >
        Reinstate
      </Button>
    </div>
  );
};

export default ExclusionRow;
