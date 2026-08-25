import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, User } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/lib/utils';
import { type ExclusionScope } from '@/api/shared/enums';
import { type ExcludeProspectDto } from '@/api/prospects/entities/request.entities';
import useDeleteProspect from '../hooks/useDeleteProspect';
import {
  DEFAULT_EXCLUDE_VALUES,
  excludeSchema,
  REASON_MAX_LENGTH,
  type ExcludeFormValues,
} from './utils';

type ExcludeDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
  prospectId: string;
  name: string;
  company: string;
  onExcluded: () => void;
}>;

const OPTIONS: ReadonlyArray<{ value: ExclusionScope; icon: typeof User; label: string }> = [
  { value: 'person', icon: User, label: 'Exclude this person' },
  { value: 'company', icon: Building2, label: 'Exclude the whole company' },
];

const ExcludeDialog = ({
  open,
  onClose,
  prospectId,
  name,
  company,
  onExcluded,
}: ExcludeDialogProps) => {
  const form = useForm<ExcludeFormValues>({
    resolver: zodResolver(excludeSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_EXCLUDE_VALUES,
  });

  const { onFetch: exclude, isLoading: excluding } = useDeleteProspect({
    onExcluded: () => {
      form.reset(DEFAULT_EXCLUDE_VALUES);
      onExcluded();
    },
  });

  const scope = useWatch({ control: form.control, name: 'scope' });
  const reason = useWatch({ control: form.control, name: 'reason' });
  const reasonLength = reason?.length ?? 0;

  const submit = (values: ExcludeFormValues) => {
    const dto: ExcludeProspectDto = {
      scope: values.scope,
      ...(values.reason.trim().length > 0 ? { reason: values.reason.trim() } : {}),
    };
    exclude({ id: prospectId, dto });
  };

  const optionHint =
    scope === 'company'
      ? `Removes every lead from ${company} from your pipeline.`
      : `${name} will no longer be sourced or contacted.`;

  return (
    <Modal open={open} onClose={onClose} title={`Exclude ${name}`}>
      <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2">
          {OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => form.setValue('scope', value, { shouldValidate: true })}
              className={cn(
                'flex items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition-colors',
                scope === value
                  ? 'border-app-accent-line bg-app-accent-bg'
                  : 'border-app-line bg-app-hover hover:bg-app-hover',
              )}
            >
              <Icon
                size={17}
                className={scope === value ? 'text-app-accent-fg' : 'text-app-faint'}
              />
              <span
                className={cn(
                  'text-[13px] font-medium',
                  scope === value ? 'text-app-fg' : 'text-app-soft',
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-app-faint">{optionHint}</p>

        <div className="flex flex-col gap-1.5">
          <Textarea
            rows={3}
            placeholder="Why? (company too big, bad timing, wrong profile…)"
            {...form.register('reason')}
          />
          <div className="flex items-center justify-between gap-3 px-0.5">
            <span className="text-xs text-app-danger-fg">
              {form.formState.errors.reason?.message}
            </span>
            <span
              className={cn(
                'shrink-0 text-xs tabular-nums text-app-faint',
                reasonLength > REASON_MAX_LENGTH && 'text-app-danger-fg',
              )}
            >
              {reasonLength}/{REASON_MAX_LENGTH}
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-app-faint">
          They'll never be proposed by the AI again. Reversible any time from the Exclusions
          page.
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            isLoading={excluding}
            disabled={!form.formState.isValid}
          >
            Exclude
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExcludeDialog;
