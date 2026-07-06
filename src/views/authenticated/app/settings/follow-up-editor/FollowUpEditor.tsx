import { type Control } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { WEEKDAYS, type SettingsFormValues } from '../utils';

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

type WeekdaysInputProps = Readonly<{
  value: ReadonlyArray<number>;
  onChange: (value: ReadonlyArray<number>) => void;
}>;

const WeekdaysInput = ({ value, onChange }: WeekdaysInputProps) => (
  <div className="flex flex-wrap gap-2">
    {WEEKDAYS.map((day) => {
      const active = value.includes(day.value);
      return (
        <button
          key={day.value}
          type="button"
          onClick={() =>
            onChange(
              active
                ? value.filter((weekday) => weekday !== day.value)
                : [...value, day.value],
            )
          }
          className="cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] transition-colors"
          style={{
            borderColor: active ? 'rgba(124,121,246,0.4)' : 'rgba(255,255,255,0.1)',
            background: active ? 'rgba(5,1,240,0.2)' : 'transparent',
            color: active ? '#A9A6FF' : '#ABA8C0',
          }}
        >
          {day.label}
        </button>
      );
    })}
  </div>
);

type FollowUpEditorProps = Readonly<{ control: Control<SettingsFormValues> }>;

const FollowUpEditor = ({ control }: FollowUpEditorProps) => (
  <div className="flex flex-col gap-4">
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
    <FormField
      control={control}
      name="followUp.excludedWeekdays"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Days the agent never sends on</FormLabel>
          <WeekdaysInput value={field.value} onChange={field.onChange} />
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

export default FollowUpEditor;
