import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { AppError, AppLoader } from '@/components/AsyncState';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/lib/utils';
import { type ImportSuppressionResultDto } from '@/api/suppression/entities/response.entities';
import useRetrieveExclusions from './hooks/useRetrieveExclusions';
import useImportExclusions from './hooks/useImportExclusions';
import ExclusionRow from './exclusion-row/ExclusionRow';
import { SCOPE_FILTERS, matchesScope, type ScopeFilter } from './utils';

const Exclusions = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportSuppressionResultDto | null>(null);
  const [filter, setFilter] = useState<ScopeFilter>('all');
  const { data, status, refetch } = useRetrieveExclusions();
  const { onFetch: importFile, isLoading: importing } = useImportExclusions({
    onImported: (imported) => {
      setResult(imported);
      refetch();
    },
  });

  const pick = (file: File | undefined) => {
    if (file) importFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (status === 'loading') {
    return (
      <AppScreen title="Exclusions">
        <AppLoader />
      </AppScreen>
    );
  }
  if (status === 'error') {
    return (
      <AppScreen title="Exclusions">
        <AppError onRetry={refetch} />
      </AppScreen>
    );
  }

  const entries = data ?? [];
  const visible = entries.filter((entry) => matchesScope(entry, filter));

  const countFor = (value: ScopeFilter): number =>
    entries.filter((entry) => matchesScope(entry, value)).length;

  return (
    <AppScreen title="Exclusions">
      <div className="h-full overflow-y-auto px-[30px] py-7">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <p className="text-sm leading-relaxed text-[#ABA8C0]">
            People and companies here are never sourced or contacted by the agent. Reinstate one
            any time to make it eligible again. You can also bulk-import people from a CSV.
          </p>

          <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[#171733] p-[16px_18px]">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => pick(event.target.files?.[0])}
            />
            <Button isLoading={importing} onClick={() => inputRef.current?.click()}>
              {!importing && <Upload size={15} />}
              Import CSV
            </Button>
            {result && (
              <span className="text-[13px] text-[#ABA8C0]">
                {result.imported} imported · {result.totalFound} found
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {SCOPE_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-[9px] border px-3 text-[13px] transition-colors',
                  filter === value
                    ? 'border-brand-400/50 bg-brand-600/[0.18] text-[#F3F2F8]'
                    : 'border-white/8 bg-white/[0.03] text-[#ABA8C0] hover:bg-white/[0.06]',
                )}
              >
                {label}
                <span className="text-[11px] text-[#6F6C85]">{countFor(value)}</span>
              </button>
            ))}
          </div>

          {visible.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {visible.map((entry) => (
                <ExclusionRow key={entry.id} entry={entry} onReinstated={refetch} />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-white/10 px-4 py-8 text-center text-[13px] text-[#6F6C85]">
              Nothing excluded here yet.
            </div>
          )}
        </div>
      </div>
    </AppScreen>
  );
};

export default Exclusions;
