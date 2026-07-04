import { type IcpDraft } from '@/api/onboarding/entities/request.entities';
import { DarkInput, DarkTextarea, LabeledField } from '../fields';

type IdealClientsStepProps = Readonly<{
  icps: ReadonlyArray<IcpDraft>;
  onUpdate: (index: number, patch: Partial<IcpDraft>) => void;
}>;

const IdealClientsStep = ({ icps, onUpdate }: IdealClientsStepProps) => (
  <div className="-mx-1 flex max-h-[344px] flex-col gap-2.5 overflow-y-auto px-1 pb-0.5">
    {icps.map((icp, index) => (
      <div
        key={index}
        className="rounded-xl border border-white/10 bg-[rgba(10,10,31,0.5)] p-[15px]"
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span className="bg-brand-600/[0.22] text-brand-300 flex size-[22px] shrink-0 items-center justify-center rounded-md text-[11px] font-medium">
            {index + 1}
          </span>
          <DarkInput
            className="h-[42px]"
            placeholder="Profile name"
            value={icp.name}
            onChange={(event) => onUpdate(index, { name: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-3">
          <LabeledField label="Archetype">
            <DarkInput
              className="h-[42px] text-[14px]"
              placeholder="e.g. VP Growth who just raised"
              value={icp.archetype}
              onChange={(event) =>
                onUpdate(index, { archetype: event.target.value })
              }
            />
          </LabeledField>
          <LabeledField label="Description">
            <DarkTextarea
              rows={2}
              placeholder="Who they are, their situation, what they struggle with."
              value={icp.description}
              onChange={(event) =>
                onUpdate(index, { description: event.target.value })
              }
            />
          </LabeledField>
          <LabeledField label="Perceived value">
            <DarkTextarea
              rows={2}
              placeholder="What they get from you, in their words."
              value={icp.perceivedValue}
              onChange={(event) =>
                onUpdate(index, { perceivedValue: event.target.value })
              }
            />
          </LabeledField>
          <LabeledField label="Angle">
            <DarkInput
              className="h-[42px] text-[14px]"
              placeholder="e.g. repeatability + time-to-pipeline"
              value={icp.angle}
              onChange={(event) =>
                onUpdate(index, { angle: event.target.value })
              }
            />
          </LabeledField>
          <LabeledField label="Golden rule (optional)">
            <DarkTextarea
              rows={2}
              placeholder="A do / don't the agent must always respect for this profile."
              value={icp.goldenRule}
              onChange={(event) =>
                onUpdate(index, { goldenRule: event.target.value })
              }
            />
          </LabeledField>
        </div>
      </div>
    ))}
  </div>
);

export { IdealClientsStep };
