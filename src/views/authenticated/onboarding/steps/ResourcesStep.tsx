import { type CompleteOnboardingDto } from '@/api/onboarding/entities/request.entities';
import { DarkInput, LabeledField } from '../fields';

type ResourcesStepProps = Readonly<{
  productPageUrl: string;
  salesDeckUrl: string;
  onChange: (patch: Partial<CompleteOnboardingDto>) => void;
}>;

const ResourcesStep = ({
  productPageUrl,
  salesDeckUrl,
  onChange,
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
  </div>
);

export { ResourcesStep };
