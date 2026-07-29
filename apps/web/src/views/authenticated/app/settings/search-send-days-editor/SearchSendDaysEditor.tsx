import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { WEEKDAYS, type SettingsFormValues } from '../utils';

type DaysInputProps = Readonly<{
  value: ReadonlyArray<number>;
  onChange: (value: ReadonlyArray<number>) => void;
}>;

const DaysInput = ({ value, onChange }: DaysInputProps) => (
  <div className="flex flex-wrap gap-2">
    {WEEKDAYS.map((day) => {
      const off = value.includes(day.value);
      const active = !off;
      const isLastActive = active && value.length >= WEEKDAYS.length - 1;
      return (
        <button
          key={day.value}
          type="button"
          disabled={isLastActive}
          onClick={() =>
            onChange(
              off
                ? value.filter((weekday) => weekday !== day.value)
                : [...value, day.value],
            )
          }
          className="rounded-lg border px-3 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed enabled:cursor-pointer"
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

type SearchSendDaysEditorProps = Readonly<{
  control: Control<SettingsFormValues>;
  name: `markets.${number}.followUp.excludedWeekdays`;
}>;

const SearchSendDaysEditor = ({ control, name }: SearchSendDaysEditorProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <DaysInput value={field.value} onChange={field.onChange} />
        <p className="text-xs leading-relaxed text-[#6F6C85]">
          The agent sources new leads and sends messages (first touch and follow-ups) only on
          the selected days. On the other days it keeps analysing replies and planning
          follow-ups.
        </p>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default SearchSendDaysEditor;
