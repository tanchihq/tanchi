import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { type IcpDraft } from '@/api/onboarding/entities/request.entities';
import { DarkInput } from '../fields';

type TargetsStepProps = Readonly<{
  icps: ReadonlyArray<IcpDraft>;
  maxIcps: number;
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
}>;

const TargetsStep = ({ icps, maxIcps, onAdd, onRemove }: TargetsStepProps) => {
  const [draftName, setDraftName] = useState('');
  const atCapacity = icps.length >= maxIcps;

  const add = () => {
    const name = draftName.trim();
    if (name.length === 0 || atCapacity) return;
    onAdd(name);
    setDraftName('');
  };

  return (
    <div className="flex flex-col gap-4">
      {icps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {icps.map((icp, index) => (
            <span
              key={index}
              className="border-brand-400/40 bg-brand-600/[0.18] text-brand-300 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px]"
            >
              {icp.name}
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${icp.name}`}
                className="hover:text-white"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {!atCapacity && (
        <div className="flex gap-2">
          <DarkInput
            placeholder="e.g. Fintech scale-ups"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
          />
          <button
            type="button"
            onClick={add}
            disabled={draftName.trim().length === 0}
            className="glass-well text-glass-fg flex h-[52px] shrink-0 items-center gap-1.5 px-4 text-[14px] disabled:opacity-50"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}

      <p className="text-ink-faint text-[12px]">
        Define 1 to 3 profiles. The agent will prioritize them.
      </p>
    </div>
  );
};

export { TargetsStep };
