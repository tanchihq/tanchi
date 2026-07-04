import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthSubmit } from '@/components/auth/AuthSubmit';
import { GlassField } from '@/components/auth/GlassField';
import { useSignIn } from './hooks/useSignIn';

const schema = z.object({
  email: z.email('Invalid email.'),
  password: z.string().min(1, 'Password is required.'),
});

type FormValues = z.infer<typeof schema>;

const SignIn = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { onFetch, isLoading } = useSignIn();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = (values: FormValues) =>
    onFetch(values, { onSuccess: () => navigate('/') });

  return (
    <AuthShell
      glyph={<LogIn size={17} className="text-ink" strokeWidth={1.7} />}
      title="Sign in"
      subtitle="Your prospect queue is waiting."
      footerText="No account yet?"
      footerLinkLabel="Create one"
      footerTo="/sign-up"
    >
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <GlassField
            icon={<Mail size={18} />}
            type="email"
            placeholder="Email"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <span className="text-danger px-0.5 text-xs">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <GlassField
            icon={<Lock size={18} />}
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            {...register('password')}
            suffix={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-glass-dim flex p-1"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          {errors.password && (
            <span className="text-danger px-0.5 text-xs">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="-mt-0.5 text-right">
          <a href="#" className="text-[13px] font-medium text-[#C4C8D2] no-underline">
            Forgot password?
          </a>
        </div>

        <AuthSubmit loading={isLoading}>Sign in</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default SignIn;
