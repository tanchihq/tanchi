import { type UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/lib/utils';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SIGNATURE_MAX_LENGTH, type SenderFieldsValues } from './utils';

type SenderFieldsProps = Readonly<{
  form: UseFormReturn<SenderFieldsValues>;
  mode: 'create' | 'edit';
}>;

const SenderFields = ({ form, mode }: SenderFieldsProps) => {
  const signatureLength = form.watch('signature')?.length ?? 0;

  return (
    <>
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
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    mode === 'edit' ? 'Leave empty to keep the current password' : undefined
                  }
                  {...field}
                />
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
            <FormLabel>Signature</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Best regards,&#10;Jane Doe · Head of Sales · Acme"
                {...field}
              />
            </FormControl>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs leading-relaxed text-[#6F6C85]">
                Added automatically at the bottom of every email you send from this mailbox.
                The AI no longer writes a signature in drafts, so this is the only one that
                appears.
              </p>
              <span
                className={cn(
                  'shrink-0 pt-0.5 text-xs tabular-nums text-[#6F6C85]',
                  signatureLength > SIGNATURE_MAX_LENGTH && 'text-danger',
                )}
              >
                {signatureLength}/{SIGNATURE_MAX_LENGTH}
              </span>
            </div>
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
    </>
  );
};

export default SenderFields;
