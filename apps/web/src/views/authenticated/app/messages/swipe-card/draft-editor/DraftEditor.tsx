import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { type QueueItemDto } from '@/api/queue/entities/response.entities';
import {
  BODY_MAX_LENGTH,
  SUBJECT_MAX_LENGTH,
  draftSchema,
  toDraftValues,
  type DraftFormValues,
} from './utils';

type Properties = Readonly<{
  item: QueueItemDto;
  saving: boolean;
  onSave: (values: DraftFormValues) => void;
  onCancel: () => void;
}>;

const DraftEditor = ({ item, saving, onSave, onCancel }: Properties) => {
  const form = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    mode: 'onChange',
    defaultValues: toDraftValues(item),
  });
  const isEmail = item.channel === 'email';

  return (
    <Form {...form}>
      <form
        data-no-swipe
        onSubmit={form.handleSubmit(onSave)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel();
        }}
        className="flex flex-col gap-2"
      >
        {isEmail && (
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Subject"
                    maxLength={SUBJECT_MAX_LENGTH}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  autoFocus
                  rows={10}
                  maxLength={BODY_MAX_LENGTH}
                  className="max-h-[320px] min-h-[200px] overflow-y-auto"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-app-faint flex items-center gap-1.5 text-xs">
          <Sparkles size={12} className="text-brand-400 shrink-0" />
          Your edits teach the AI what works for this kind of prospect.
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Button
            type="submit"
            isLoading={saving}
            disabled={!form.formState.isValid || !form.formState.isDirty}
          >
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DraftEditor;
