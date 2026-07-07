import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { AppError, AppLoader } from '@/components/AsyncState';
import { Button } from '@/components/ui/button';
import { type ImportSuppressionResultDto } from '@/api/suppression/entities/response.entities';
import useRetrieveSuppression from './hooks/useRetrieveSuppression';
import useImportSuppression from './hooks/useImportSuppression';

const dayLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const Suppression = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportSuppressionResultDto | null>(null);
  const { data, status, refetch } = useRetrieveSuppression();
  const { onFetch: importFile, isLoading: importing } = useImportSuppression({
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
      <AppScreen title="Do-not-contact">
        <AppLoader />
      </AppScreen>
    );
  }
  if (status === 'error') {
    return (
      <AppScreen title="Do-not-contact">
        <AppError onRetry={refetch} />
      </AppScreen>
    );
  }

  const entries = data ?? [];

  return (
    <AppScreen title="Do-not-contact">
      <div className="h-full overflow-y-auto px-[30px] py-7">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <p className="text-sm leading-relaxed text-[#ABA8C0]">
            Upload a CSV of addresses the agent must never contact. Any column format works —
            all emails found in the file are extracted.
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
              Upload CSV
            </Button>
            {result && (
              <span className="text-[13px] text-[#ABA8C0]">
                {result.imported} imported · {result.totalFound} found
              </span>
            )}
          </div>

          {entries.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {entries.map((entry) => (
                <div
                  key={entry.email}
                  className="flex items-center justify-between rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
                >
                  <span className="truncate text-[13px] text-[#F3F2F8]">{entry.email}</span>
                  <span className="text-[11px] text-[#6F6C85]">{dayLabel(entry.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-white/10 px-4 py-8 text-center text-[13px] text-[#6F6C85]">
              No suppressed addresses yet.
            </div>
          )}
        </div>
      </div>
    </AppScreen>
  );
};

export default Suppression;
