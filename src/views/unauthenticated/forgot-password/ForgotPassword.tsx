import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { GlassField } from '@/components/auth/GlassField';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { forgotPasswordSchema, type ForgotPasswordValues } from './utils';
import { useRequestPasswordReset } from './hooks/useRequestPasswordReset';

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const { onFetch, isLoading } = useRequestPasswordReset();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const submit = ({ email }: ForgotPasswordValues) =>
    onFetch(email, { onSuccess: () => setSubmitted(true) });

  return (
    <AuthShell
      glyph={<KeyRound size={17} className="text-ink" strokeWidth={1.7} />}
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link."
      footerText="Remembered it?"
      footerLinkLabel="Sign in"
      footerTo="/sign-in"
    >
      {submitted ? (
        <p className="text-center text-sm leading-[1.5] text-[#A7ACB8]">
          If an account exists for that email, you&apos;ll receive a reset link
          shortly. Check your inbox and spam folder.
        </p>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <GlassField
                      icon={<Mail size={18} />}
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="mt-2 h-[52px] w-full"
              isLoading={isLoading}
              disabled={!form.formState.isValid}
            >
              Send reset link
            </Button>
          </form>
        </Form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
