import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import SenderFields from '../sender-fields/SenderFields';
import useCreateSender from '../hooks/useCreateSender';
import { DEFAULT_SENDER_VALUES, senderSchema, type SenderFormValues } from './utils';

type SenderFormProps = Readonly<{ onCreated: () => void }>;

const SenderForm = ({ onCreated }: SenderFormProps) => {
  const form = useForm<SenderFormValues>({
    resolver: zodResolver(senderSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_SENDER_VALUES,
  });

  const { onFetch: create, isLoading: creating } = useCreateSender({
    onCreated: () => {
      form.reset(DEFAULT_SENDER_VALUES);
      onCreated();
    },
  });

  return (
    <div className="rounded-[18px] border border-app-line bg-app-surface p-[22px_24px]">
      <div className="mb-4 text-[11px] uppercase tracking-[0.06em] text-app-faint">
        Connect a mailbox
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => create(values))}>
          <SenderFields form={form} mode="create" />

          <Button
            type="submit"
            size="lg"
            className="mt-5"
            isLoading={creating}
            disabled={!form.formState.isValid}
          >
            Connect mailbox
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SenderForm;
