import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
    <div className="rounded-[18px] border border-white/[0.07] bg-[#171733] p-[22px_24px]">
      <div className="mb-4 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
        Connect a mailbox
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => create(values))}>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fromName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="smtpHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMTP host</FormLabel>
                  <FormControl>
                    <Input placeholder="smtp.company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="smtpPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMTP port</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imapHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMAP host</FormLabel>
                  <FormControl>
                    <Input placeholder="imap.company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imapPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMAP port</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dailyCap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily cap</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="signature"
            render={({ field }) => (
              <FormItem className="mt-3.5">
                <FormLabel>Signature (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Appended to every message sent from this mailbox."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-3.5 flex items-center gap-5">
            <FormField
              control={form.control}
              name="smtpSecure"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-[13px] text-[#ABA8C0]">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  SMTP secure (TLS)
                </label>
              )}
            />
            <FormField
              control={form.control}
              name="imapSecure"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-[13px] text-[#ABA8C0]">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  IMAP secure (TLS)
                </label>
              )}
            />
          </div>

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
