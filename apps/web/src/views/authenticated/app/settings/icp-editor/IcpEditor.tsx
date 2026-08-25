import { type Control, useFieldArray } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { EMPTY_ICP, type SettingsFormValues } from '../utils';

const MAX_ICPS = 3;

type IcpEditorProps = Readonly<{
  control: Control<SettingsFormValues>;
  marketIndex: number;
}>;

const IcpEditor = ({ control, marketIndex }: IcpEditorProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `markets.${marketIndex}.icps`,
  });

  return (
    <div className="flex flex-col gap-2.5">
      {fields.map((item, index) => (
        <div
          key={item.id}
          className="rounded-xl border border-app-line bg-[var(--app-well)] p-[15px]"
        >
          <div className="mb-3 flex items-center gap-2.5">
            <span className="bg-app-accent-bg text-app-accent-fg flex size-[22px] shrink-0 items-center justify-center rounded-md text-[11px] font-medium">
              {index + 1}
            </span>
            <FormField
              control={control}
              name={`markets.${marketIndex}.icps.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input className="h-[38px]" placeholder="Profile name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {fields.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => remove(index)}
                aria-label="Remove profile"
              >
                <X size={16} />
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            <FormField
              control={control}
              name={`markets.${marketIndex}.icps.${index}.archetype`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input className="h-[38px]" placeholder="Archetype (optional)" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`markets.${marketIndex}.icps.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={2} placeholder="Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`markets.${marketIndex}.icps.${index}.perceivedValue`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={2} placeholder="Perceived value (optional)" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`markets.${marketIndex}.icps.${index}.angle`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input className="h-[38px]" placeholder="Angle (optional)" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`markets.${marketIndex}.icps.${index}.goldenRule`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={2} placeholder="Golden rule (optional)" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
      {fields.length < MAX_ICPS && (
        <Button
          variant="outline"
          className="h-[42px] border-dashed"
          onClick={() => append(EMPTY_ICP)}
        >
          <Plus size={15} /> Add a profile
        </Button>
      )}
    </div>
  );
};

export default IcpEditor;
