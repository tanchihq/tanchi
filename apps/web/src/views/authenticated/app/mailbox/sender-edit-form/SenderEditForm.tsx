import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { type SenderDto } from '@/api/senders/entities/response.entities';
import SenderFields from '../sender-fields/SenderFields';
import useEditSender from '../hooks/useEditSender';
import {
  buildEditDefaults,
  buildEditPayload,
  editSenderSchema,
  type EditSenderFormValues,
} from './utils';

type SenderEditFormProps = Readonly<{
  sender: SenderDto;
  onSaved: (sender: SenderDto) => void;
  onCancel: () => void;
}>;

const SenderEditForm = ({ sender, onSaved, onCancel }: SenderEditFormProps) => {
  const form = useForm<EditSenderFormValues>({
    resolver: zodResolver(editSenderSchema),
    mode: 'onChange',
    defaultValues: buildEditDefaults(sender),
  });

  const { onFetch: save, isLoading: saving } = useEditSender({ onEdited: onSaved });

  const submit = (values: EditSenderFormValues) =>
    save({ id: sender.id, dto: buildEditPayload(values, form.formState.dirtyFields) });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)}>
        <SenderFields form={form} mode="edit" />

        <div className="mt-5 flex items-center gap-2.5">
          <Button
            type="submit"
            size="lg"
            isLoading={saving}
            disabled={!form.formState.isValid || !form.formState.isDirty}
          >
            Save changes
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SenderEditForm;
