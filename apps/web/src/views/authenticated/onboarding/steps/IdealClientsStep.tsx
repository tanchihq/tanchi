import { useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { type IcpDraft } from '@/api/onboarding/entities/request.entities';
import { DarkInput, DarkTextarea, LabeledField } from '../fields';

type IdealClientsStepProps = Readonly<{
  icps: ReadonlyArray<IcpDraft>;
  maxIcps: number;
  canGenerate: boolean;
  generating: boolean;
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, patch: Partial<IcpDraft>) => void;
  onGenerate: () => void;
}>;

const IdealClientsStep = ({
  icps,
  maxIcps,
  canGenerate,
  generating,
  onAdd,
  onRemove,
  onUpdate,
  onGenerate,
}: IdealClientsStepProps) => {
  const [draftName, setDraftName] = useState('');
  const atCapacity = icps.length >= maxIcps;
  const hasIcps = icps.length > 0;

  const add = () => {
    const name = draftName.trim();
    if (name.length === 0 || atCapacity) return;
    onAdd(name);
    setDraftName('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="h-[46px] w-full"
          isLoading={generating}
          disabled={!canGenerate}
          onClick={onGenerate}
        >
          {!generating && <Sparkles size={14} />}
          {hasIcps ? 'Replace with AI suggestions' : 'Generate with AI'}
        </Button>
        <p className="text-ink-faint text-[12px] leading-relaxed">
          {canGenerate
            ? 'Reads your website and resources, then drafts complete profiles in English. Open any profile to adjust it.'
            : 'Add your website on the first step to let the AI draft profiles.'}
        </p>
      </div>

      {hasIcps && (
        <Accordion
          type="multiple"
          className="border-app-line divide-app-line max-h-[300px] divide-y overflow-y-auto rounded-xl border"
        >
          {icps.map((icp, index) => (
            <AccordionItem
              key={index}
              value={`icp-${index}`}
              className="border-b-0 px-3"
            >
              <div className="flex items-center gap-2">
                <AccordionTrigger className="py-2.5 hover:no-underline">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="bg-app-accent-bg text-app-accent-fg flex size-[20px] shrink-0 items-center justify-center rounded-md text-[10px] font-medium">
                      {index + 1}
                    </span>
                    <span className="text-app-fg truncate text-[13px]">
                      {icp.name === '' ? 'Untitled profile' : icp.name}
                    </span>
                  </span>
                </AccordionTrigger>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove ${icp.name}`}
                  className="text-app-faint hover:text-app-fg shrink-0 p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <AccordionContent className="flex flex-col gap-3 pb-3">
                <LabeledField label="Profile name">
                  <DarkInput
                    className="h-[42px] text-[14px]"
                    placeholder="e.g. Fintech scale-ups"
                    value={icp.name}
                    onChange={(event) =>
                      onUpdate(index, { name: event.target.value })
                    }
                  />
                </LabeledField>
                <LabeledField label="Archetype (optional)">
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
                    rows={3}
                    placeholder="Who they are, their situation, what they struggle with."
                    value={icp.description}
                    onChange={(event) =>
                      onUpdate(index, { description: event.target.value })
                    }
                  />
                </LabeledField>
                <LabeledField label="Perceived value (optional)">
                  <DarkTextarea
                    rows={2}
                    placeholder="What they get from you, in their words."
                    value={icp.perceivedValue}
                    onChange={(event) =>
                      onUpdate(index, { perceivedValue: event.target.value })
                    }
                  />
                </LabeledField>
                <LabeledField label="Angle (optional)">
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {!atCapacity && (
        <div className="flex gap-2">
          <DarkInput
            className="h-[46px]"
            placeholder="Or name a profile yourself"
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
            className="glass-well text-app-fg flex h-[46px] shrink-0 items-center gap-1.5 px-4 text-[14px] disabled:opacity-50"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}

      <p className="text-ink-faint text-[12px]">
        1 to 3 profiles. Written in English by default — you can change the
        language and add markets later in Settings.
      </p>
    </div>
  );
};

export { IdealClientsStep };
