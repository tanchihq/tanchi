import { useState } from 'react';
import { Eye, TriangleAlert, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { type AutopilotDto } from '@/api/autopilot/entities/response.entities';
import { cn } from '@/utils/lib/utils';
import { autopilotWarnings, joinNames, statusLine } from './utils';

type Properties = Readonly<{
  autopilot: AutopilotDto;
  updating: boolean;
  onChange: (enabled: boolean) => void;
}>;

const MODES = [
  { enabled: false, label: 'Review', icon: Eye },
  { enabled: true, label: 'Autopilot', icon: Zap },
] as const;

const AutopilotBar = ({ autopilot, updating, onChange }: Properties) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const warnings = autopilotWarnings(autopilot);

  const select = (enabled: boolean) => {
    if (enabled === autopilot.enabled || updating) return;
    if (enabled && autopilot.icpsWithoutPlaybook.length > 0) {
      setConfirmOpen(true);
      return;
    }
    onChange(enabled);
  };

  const confirm = () => {
    setConfirmOpen(false);
    onChange(true);
  };

  return (
    <div className="border-app-line bg-app-surface rounded-2xl border p-[12px_14px]">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Sending mode"
          className="bg-app-hover border-app-line flex shrink-0 rounded-[10px] border p-[3px]"
        >
          {MODES.map(({ enabled, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={autopilot.enabled === enabled}
              disabled={updating}
              onClick={() => select(enabled)}
              className={cn(
                'flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] px-3 text-[13px] transition-colors',
                autopilot.enabled === enabled
                  ? 'bg-app-surface text-app-fg font-medium shadow-sm'
                  : 'text-app-soft hover:text-app-fg',
              )}
            >
              <Icon
                size={14}
                className={enabled ? 'text-brand-400' : undefined}
              />
              {label}
            </button>
          ))}
        </div>
        <p className="text-app-faint min-w-0 flex-1 text-[12.5px] leading-snug">
          {statusLine(autopilot)}
        </p>
      </div>

      {warnings.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {warnings.map((warning) => (
            <li
              key={warning.key}
              className="text-app-warn-fg bg-app-warn-bg flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px] leading-snug"
            >
              <TriangleAlert size={14} className="mt-px shrink-0" />
              {warning.text}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Turn on autopilot?"
      >
        <div className="text-app-soft flex flex-col gap-3 text-[13.5px] leading-relaxed">
          <p className="text-app-warn-fg bg-app-warn-bg flex items-start gap-2 rounded-lg px-3 py-2.5">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            Not recommended yet: the AI doesn't know how you work.
          </p>
          <p>
            There is no playbook yet for{' '}
            {joinNames(autopilot.icpsWithoutPlaybook)}. The playbook is built
            from the messages you review, edit and send. Without it, emails
            would go out without your eyes on them and without your lessons.
          </p>
          <p>Review a few dozen messages first, then come back to autopilot.</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={confirm}>
            Turn on anyway
          </Button>
          <Button onClick={() => setConfirmOpen(false)}>Keep reviewing</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AutopilotBar;
