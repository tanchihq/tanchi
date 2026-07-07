import { Navigate, useLocation } from 'react-router-dom';
import { Check, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { FullPageLoader } from '@/components/FullPageLoader';
import { useAuth } from '@/store/context/auth.context';
import { useResendVerificationEmail } from './hooks/useResendVerificationEmail';

type LocationState = Readonly<{ email?: string }> | null;

const VerifyEmail = () => {
  const { state } = useAuth();
  const location = useLocation();
  const { onFetch, isLoading, status } = useResendVerificationEmail();

  if (state.status === 'loading') return <FullPageLoader />;

  if (state.user !== null && state.user.emailVerified) {
    return <Navigate replace to="/" />;
  }

  const emailFromState = (location.state as LocationState)?.email;
  const email = state.user?.email ?? emailFromState;

  if (email === undefined) {
    return <Navigate replace to="/sign-in" />;
  }

  return (
    <AuthShell
      glyph={<MailCheck size={17} className="text-ink" strokeWidth={1.7} />}
      title="Verify your email"
      subtitle={`Check your inbox — we sent a verification link to ${email}.`}
      footerText="Wrong account?"
      footerLinkLabel="Sign in"
      footerTo="/sign-in"
    >
      <div className="flex flex-col gap-4">
        <p className="text-center text-[13px] leading-[1.5] text-[#A7ACB8]">
          Click the link in the email to activate your account. It may take a
          minute to arrive, and don&apos;t forget to check your spam folder.
        </p>

        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="h-[52px] w-full"
          isLoading={isLoading}
          onClick={() => onFetch(email)}
        >
          {status === 'success' ? (
            <span className="flex items-center gap-2">
              <Check size={16} /> Email sent
            </span>
          ) : (
            "Didn't receive the email? Resend it"
          )}
        </Button>
      </div>
    </AuthShell>
  );
};

export default VerifyEmail;
