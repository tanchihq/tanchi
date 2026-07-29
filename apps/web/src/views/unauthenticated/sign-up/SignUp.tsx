import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import { captureFunnelPageview } from '@/analytics/posthog';
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
import { signUpSchema, splitFullName, type SignUpValues } from './utils';
import { useSignUp } from './hooks/useSignUp';

const SignUp = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { onFetch, isLoading } = useSignUp();

  useEffect(() => {
    captureFunnelPageview();
  }, []);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: { fullName: '', company: '', email: '', password: '' },
  });

  const submit = ({ fullName, company, email, password }: SignUpValues) => {
    const { firstName, lastName } = splitFullName(fullName);
    onFetch(
      { firstName, lastName, company, email, password },
      { onSuccess: () => navigate('/') },
    );
  };

  return (
    <AuthShell
      glyph={<UserPlus size={17} className="text-ink" strokeWidth={1.7} />}
      title="Create account"
      subtitle="Set up your prospecting in a few minutes."
      footerText="Already have an account?"
      footerLinkLabel="Sign in"
      footerTo="/sign-in"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <GlassField
                    icon={<User size={18} />}
                    placeholder="Full name"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <GlassField
                    icon={<Building2 size={18} />}
                    placeholder="Company name"
                    autoComplete="organization"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <GlassField
                    icon={<Lock size={18} />}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password"
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
                {form.formState.errors.password ? (
                  <FormMessage />
                ) : (
                  <span className="text-ink-faint px-0.5 text-[11px]">
                    At least 8 characters, one uppercase letter and one number.
                  </span>
                )}
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
            Create my account
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
};

export default SignUp;
