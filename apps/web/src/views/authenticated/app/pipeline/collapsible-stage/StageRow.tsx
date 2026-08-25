import { useState } from 'react';
import { Ban } from 'lucide-react';
import { type Stage } from '@/api/shared/enums';
import { type ProspectDto } from '@/api/prospects/entities/response.entities';
import { SelectNative } from '@/components/ui/select-native';
import { ALL_STAGES, STAGE_LABEL } from '@/utils/prospect-display';
import { fullName } from '@/utils/format';
import ExcludeDialog from '../exclude-dialog/ExcludeDialog';
import { wakeLabel } from './utils';

type StageRowProps = Readonly<{
  prospect: ProspectDto;
  showWake: boolean;
  expired: boolean;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: Stage) => void;
  onExcluded: () => void;
}>;

const StageRow = ({
  prospect,
  showWake,
  expired,
  onOpen,
  onMove,
  onExcluded,
}: StageRowProps) => {
  const [excludeOpen, setExcludeOpen] = useState(false);
  const wake = wakeLabel(prospect.snoozeUntil);

  return (
    <div
      onClick={() => onOpen(prospect.id)}
      className="flex cursor-pointer items-center gap-2 rounded-[9px] border border-app-line bg-app-hover px-3 py-2 transition-colors hover:bg-app-hover"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-[12.5px] tracking-tight text-app-fg">
          {fullName(prospect.firstName, prospect.lastName)}
        </span>
        {prospect.hot && (
          <span
            className="bg-brand-400 size-1.5 shrink-0 rounded-full"
            style={{ boxShadow: '0 0 0 3px var(--app-accent-line)' }}
          />
        )}
        <span className="shrink-0 text-app-faint">·</span>
        <span className="truncate text-[11.5px] text-app-soft">{prospect.company}</span>
        <span className="hidden max-w-[130px] shrink-0 truncate rounded-md border border-app-line bg-app-hover px-[7px] py-[1px] text-[10.5px] text-app-faint sm:inline">
          {prospect.icp}
        </span>
      </div>

      {showWake && wake && (
        <span
          className={
            expired
              ? 'text-app-warn-fg shrink-0 whitespace-nowrap text-[11px] font-medium'
              : 'shrink-0 whitespace-nowrap text-[11px] text-app-faint'
          }
        >
          {expired ? `ready · ${wake}` : wake}
        </span>
      )}

      <div
        className="flex shrink-0 items-center gap-1.5"
        onClick={(event) => event.stopPropagation()}
      >
        <SelectNative
          value={prospect.stage}
          onChange={(event) => onMove(prospect.id, event.target.value as Stage)}
          className="h-7 w-auto rounded-md px-2 py-0 text-[11.5px]"
          aria-label="Change stage"
        >
          {ALL_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABEL[stage]}
            </option>
          ))}
        </SelectNative>
        <button
          type="button"
          title="Exclude"
          aria-label="Exclude prospect"
          onClick={() => setExcludeOpen(true)}
          className="flex size-7 items-center justify-center rounded-md border border-app-line bg-app-hover text-app-faint transition-colors hover:text-app-danger-fg"
        >
          <Ban size={13} />
        </button>
      </div>

      {excludeOpen && (
        <ExcludeDialog
          open
          onClose={() => setExcludeOpen(false)}
          prospectId={prospect.id}
          name={fullName(prospect.firstName, prospect.lastName)}
          company={prospect.company}
          onExcluded={() => {
            setExcludeOpen(false);
            onExcluded();
          }}
        />
      )}
    </div>
  );
};

export default StageRow;
