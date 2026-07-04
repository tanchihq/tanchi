import { type CompleteOnboardingDto } from '@/api/onboarding/entities/request.entities';
import { DarkInput, LabeledField } from '../fields';

type CompanyStepProps = Readonly<{
  companyName: string;
  website: string;
  onChange: (patch: Partial<CompleteOnboardingDto>) => void;
}>;

const CompanyStep = ({ companyName, website, onChange }: CompanyStepProps) => (
  <div className="flex flex-col gap-3.5">
    <LabeledField label="Company name">
      <DarkInput
        placeholder="Swee Studio"
        value={companyName}
        onChange={(event) => onChange({ companyName: event.target.value })}
      />
    </LabeledField>
    <LabeledField label="Website">
      <DarkInput
        placeholder="https://"
        value={website}
        onChange={(event) => onChange({ website: event.target.value })}
      />
    </LabeledField>
  </div>
);

export { CompanyStep };
