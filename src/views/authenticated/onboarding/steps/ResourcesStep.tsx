import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CompleteOnboardingDto } from '@/api/onboarding/entities/request.entities';
import { DarkInput, DarkTextarea, LabeledField } from '../fields';

type ResourcesStepProps = Readonly<{
  productPageUrl: string;
  salesDeckUrl: string;
  companyProfile: string;
  generating: boolean;
  onChange: (patch: Partial<CompleteOnboardingDto>) => void;
  onGenerate: () => void;
}>;

const ResourcesStep = ({
  productPageUrl,
  salesDeckUrl,
  companyProfile,
  generating,
  onChange,
  onGenerate,
}: ResourcesStepProps) => (
  <div className="flex flex-col gap-3.5">
    <LabeledField label="Product page">
      <DarkInput
        placeholder="https://"
        value={productPageUrl}
        onChange={(event) => onChange({ productPageUrl: event.target.value })}
      />
    </LabeledField>
    <LabeledField label="Sales deck">
      <DarkInput
        placeholder="Add a link"
        value={salesDeckUrl}
        onChange={(event) => onChange({ salesDeckUrl: event.target.value })}
      />
    </LabeledField>
    <div>
      <div className="mb-[7px] flex items-center justify-between">
        <span className="text-[13px] text-[#A7ACB8]">Company profile</span>
        <Button variant="outline" size="sm" isLoading={generating} onClick={onGenerate}>
          {!generating && <Sparkles size={13} />}
          Generate
        </Button>
      </div>
      <DarkTextarea
        rows={4}
        placeholder="Let the AI draft it from your website, or write it yourself."
        value={companyProfile}
        onChange={(event) => onChange({ companyProfile: event.target.value })}
      />
    </div>
  </div>
);

export { ResourcesStep };
