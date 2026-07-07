import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
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
import { signInSchema, type SignInValues } from './utils';
import { useSignIn } from './hooks/useSignIn';

const SignIn = () => {
  const [showPw, setShowPw] = useState(false);
  const { onFetch, isLoading } = useSignIn();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const submit = (values: SignInValues) => onFetch(values);

  return (
    <AuthShell
      glyph={<LogIn size={17} className="text-ink" strokeWidth={1.7} />}
      title="Sign in"
      subtitle="Your prospect queue is waiting."
      footerText="No account yet?"
      footerLinkLabel="Create one"
      footerTo="/sign-up"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-3">
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
                    autoComplete="current-password"
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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="-mt-0.5 text-right">
            <Link
              to="/forgot-password"
              className="text-[13px] font-medium text-[#C4C8D2] no-underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-[52px] w-full"
            isLoading={isLoading}
            disabled={!form.formState.isValid}
          >
            Sign in
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
};

export default SignIn;
