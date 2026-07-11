import { type Control } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { type SettingsFormValues } from '../utils';

const MAX_INTERVALS = 10;

type IntervalsInputProps = Readonly<{
  value: ReadonlyArray<number>;
  onChange: (value: ReadonlyArray<number>) => void;
}>;

const IntervalsInput = ({ value, onChange }: IntervalsInputProps) => (
  <div className="flex flex-col gap-2">
    {value.map((days, index) => (
      <div key={index} className="flex items-center gap-2.5">
        <span className="w-[92px] text-[13px] text-[#ABA8C0]">Follow-up {index + 1}</span>
        <Input
          type="number"
          className="h-[38px] w-20"
          value={days}
          onChange={(event) =>
            onChange(value.map((day, position) => (position === index ? event.target.valueAsNumber : day)))
          }
        />
        <span className="text-[13px] text-[#6F6C85]">
          business days after {index === 0 ? 'the first message' : 'the previous one'}
        </span>
        {value.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-8"
            onClick={() => onChange(value.filter((_, position) => position !== index))}
            aria-label="Remove follow-up"
          >
            <X size={16} />
          </Button>
        )}
      </div>
    ))}
    {value.length < MAX_INTERVALS && (
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...value, 3])}
      >
        <Plus size={14} /> Add a follow-up
      </Button>
    )}
  </div>
);

type FollowUpEditorProps = Readonly<{ control: Control<SettingsFormValues> }>;

const FollowUpEditor = ({ control }: FollowUpEditorProps) => (
  <FormField
    control={control}
    name="followUp.intervals"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Cadence — spacing between each follow-up</FormLabel>
        <IntervalsInput value={field.value} onChange={field.onChange} />
        <FormMessage />
      </FormItem>
    )}
  />
);

export default FollowUpEditor;
