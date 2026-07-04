import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthSubmit } from '@/components/auth/AuthSubmit';
import { GlassField } from '@/components/auth/GlassField';
import { useSignUp } from './hooks/useSignUp';

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
      error: 'Enter your first and last name.',
    }),
  company: z.string().trim().min(1, 'Company name is required.'),
  email: z.email('Invalid email.'),
  password: z
    .string()
    .min(8, 'At least 8 characters.')
    .regex(/[A-Z]/, 'Add an uppercase letter.')
    .regex(/[0-9]/, 'Add a number.'),
});

type FormValues = z.infer<typeof schema>;

const splitFullName = (
  fullName: string,
): Readonly<{ firstName: string; lastName: string }> => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const [firstName, ...rest] = parts;
  return { firstName: firstName ?? '', lastName: rest.join(' ') };
};

const SignUp = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { onFetch, isLoading } = useSignUp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', company: '', email: '', password: '' },
  });

  const submit = ({ fullName, company, email, password }: FormValues) => {
    const { firstName, lastName } = splitFullName(fullName);
    onFetch(
      { firstName, lastName, company, email, password },
      { onSuccess: () => navigate('/verify-email') },
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
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <GlassField
            icon={<User size={18} />}
            placeholder="Full name"
            autoComplete="name"
            {...register('fullName')}
          />
          {errors.fullName && (
            <span className="text-danger px-0.5 text-xs">
              {errors.fullName.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <GlassField
            icon={<Building2 size={18} />}
            placeholder="Company name"
            autoComplete="organization"
            {...register('company')}
          />
          {errors.company && (
            <span className="text-danger px-0.5 text-xs">
              {errors.company.message}
            </span>
          )}
        </div>

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
            autoComplete="new-password"
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
          {errors.password ? (
            <span className="text-danger px-0.5 text-xs">
              {errors.password.message}
            </span>
          ) : (
            <span className="text-ink-faint px-0.5 text-[11px]">
              At least 8 characters, one uppercase letter and one number.
            </span>
          )}
        </div>

        <AuthSubmit loading={isLoading}>Create my account</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default SignUp;
