import { type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { AuthBackground } from '@/components/auth/AuthBackground';

type OnboardingShellProps = Readonly<{
  stepIndex: number;
  stepCount: number;
  stepName: string;
  stepTitle: string;
  stepSubtitle: string;
  canContinue: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
  children: ReactNode;
}>;

const OnboardingShell = ({
  stepIndex,
  stepCount,
  stepName,
  stepTitle,
  stepSubtitle,
  canContinue,
  isLastStep,
  isSubmitting,
  onBack,
  onContinue,
  children,
}: OnboardingShellProps) => {
  const segments = Array.from({ length: stepCount }, (_, index) => index);

  return (
    <div className="bg-night-900 relative min-h-screen w-full overflow-hidden">
      <AuthBackground />

      <div className="relative z-1 flex min-h-screen items-center justify-center px-5 py-10">
        <div
          className="w-full max-w-[480px]"
          style={{ animation: 'sl-card-in 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <div className="mb-5 text-center">
            <div className="text-glass-fg text-[25px] font-semibold tracking-tighter">
              Configure your prospecting
            </div>
            <div className="text-ink-faint mt-1.5 text-sm">
              Four quick steps, then the agent gets to work.
            </div>
          </div>

          <div className="glass-card relative overflow-hidden px-8 pt-[30px] pb-[26px]">
            <div className="glass-hairline" />

            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.06em] text-[#9EA3AE]">
                Step {stepIndex + 1} of {stepCount}
              </span>
              <span className="text-xs text-[#9EA3AE]">{stepName}</span>
            </div>

            <div className="mb-6 flex gap-1.5">
              {segments.map((index) => (
                <div
                  key={index}
                  className="h-1 flex-1 rounded-[2px]"
                  style={{
                    background:
                      index <= stepIndex
                        ? 'var(--color-brand-600)'
                        : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>

            <div className="text-glass-fg mb-1.5 text-[20px] font-medium tracking-tighter">
              {stepTitle}
            </div>
            <div className="mb-[22px] text-sm leading-[1.45] text-[#A7ACB8]">
              {stepSubtitle}
            </div>

            {children}

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="text-glass-soft flex items-center gap-1.5 text-[14px] font-medium transition-colors hover:text-white"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue || isSubmitting}
                className="shadow-brand rounded-well bg-brand-600 hover:bg-brand-700 active:bg-brand-800 flex h-[48px] items-center justify-center gap-2 px-6 text-[15px] font-medium tracking-tight text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    {isLastStep ? 'Finish' : 'Continue'}
                    {!isLastStep && <ArrowRight size={17} />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { OnboardingShell };
