import { useState } from 'react';
import { AtSign, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fullName } from '@/utils/format';
import useRetrieveProspects from '../hooks/useRetrieveProspects';
import { matchesProspect } from '../utils';

type LeadAttachMenuProps = Readonly<{
  attachedLeadIds: ReadonlyArray<string>;
  onAttach: (leadId: string) => void;
}>;

const LeadAttachMenu = ({ attachedLeadIds, onAttach }: LeadAttachMenuProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data } = useRetrieveProspects();

  const prospects = (data ?? [])
    .filter((prospect) => !attachedLeadIds.includes(prospect.id))
    .filter((prospect) => matchesProspect(prospect, query));

  const attach = (leadId: string) => {
    onAttach(leadId);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-6 items-center gap-1 rounded-full border border-dashed border-white/15 px-2 text-[11.5px] text-[#8F8CA6] transition-colors hover:border-white/25 hover:text-white"
      >
        <AtSign size={12} /> Add a lead
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="glass-card shadow-glass absolute bottom-8 left-0 z-20 w-[300px] rounded-[14px] border border-white/[0.08] bg-[#171733] p-2.5">
            <div className="relative mb-2">
              <Search
                size={14}
                className="text-glass-dim pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or company"
                className="h-8 pl-9 text-[12.5px]"
              />
            </div>
            <div className="flex max-h-[260px] flex-col gap-0.5 overflow-y-auto">
              {prospects.length === 0 ? (
                <div className="px-2 py-4 text-center text-[12px] text-[#6F6C85]">
                  No prospect to add.
                </div>
              ) : (
                prospects.map((prospect) => (
                  <button
                    key={prospect.id}
                    type="button"
                    onClick={() => attach(prospect.id)}
                    className="flex flex-col rounded-[9px] px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="truncate text-[12.5px] text-[#F3F2F8]">
                      {fullName(prospect.firstName, prospect.lastName)}
                    </span>
                    <span className="truncate text-[11px] text-[#6F6C85]">
                      {prospect.company}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadAttachMenu;
