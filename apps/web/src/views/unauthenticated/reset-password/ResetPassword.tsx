import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
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
import { resetPasswordSchema, type ResetPasswordValues } from './utils';
import { useResetPassword } from './hooks/useResetPassword';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPw, setShowPw] = useState(false);
  const { onFetch, isLoading } = useResetPassword();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const submit = ({ newPassword }: ResetPasswordValues) => {
    if (token === null) return;
    onFetch({ newPassword, token });
  };

  return (
    <AuthShell
      glyph={<ShieldCheck size={17} className="text-ink" strokeWidth={1.7} />}
      title="Reset password"
      subtitle="Choose a new password for your account."
      footerText="Remembered it?"
      footerLinkLabel="Sign in"
      footerTo="/sign-in"
    >
      {token === null ? (
        <p className="text-center text-sm leading-[1.5] text-[#A7ACB8]">
          This reset link is invalid or has expired.{' '}
          <Link to="/forgot-password" className="text-brand-600 no-underline">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <GlassField
                      icon={<Lock size={18} />}
                      type={showPw ? 'text' : 'password'}
                      placeholder="New password"
                      autoComplete="new-password"
                      {...field}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPw((value) => !value)}
                          className="text-glass-dim flex p-1"
                          aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </FormControl>
                  {form.formState.errors.newPassword ? (
                    <FormMessage />
                  ) : (
                    <span className="text-ink-faint px-0.5 text-[11px]">
                      At least 8 characters, one uppercase letter and one number.
                    </span>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <GlassField
                      icon={<Lock size={18} />}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
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
              Update password
            </Button>
          </form>
        </Form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
