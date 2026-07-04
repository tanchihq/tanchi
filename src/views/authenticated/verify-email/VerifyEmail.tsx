import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useResendVerificationEmail } from './hooks/useResendVerificationEmail';

type LocationState = Readonly<{ email?: string }> | null;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as LocationState)?.email;
  const { onFetch, isLoading } = useResendVerificationEmail();

  const resend = () => {
    if (email === undefined) return;
    onFetch({ email, callbackURL: `${window.location.origin}/app` });
  };

  return (
    <AuthShell
      glyph={<MailCheck size={17} className="text-ink" strokeWidth={1.7} />}
      title="Check your inbox"
      subtitle={
        email !== undefined
          ? `We sent a verification link to ${email}. Verify your account to keep it secure.`
          : 'We sent you a verification link. Verify your account to keep it secure.'
      }
      footerText="Wrong email?"
      footerLinkLabel="Sign up again"
      footerTo="/sign-up"
    >
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="shadow-brand rounded-well bg-brand-600 hover:bg-brand-700 active:bg-brand-800 flex h-[52px] items-center justify-center gap-2 text-[15px] font-medium tracking-tight text-white transition-colors"
        >
          Continue to setup <ArrowRight size={17} />
        </button>

        {email !== undefined && (
          <button
            type="button"
            onClick={resend}
            disabled={isLoading}
            className="text-glass-soft h-11 text-[13px] font-medium transition-colors hover:text-white disabled:opacity-60"
          >
            {isLoading ? 'Sending…' : "Didn't get it? Resend email"}
          </button>
        )}
      </div>
    </AuthShell>
  );
};

export default VerifyEmail;
