import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  type CompleteOnboardingDto,
  type IcpDraft,
} from '@/api/onboarding/entities/request.entities';
import { type OnboardingStateDto } from '@/api/onboarding/entities/response.entities';
import { captureFunnelPageview } from '@/analytics/posthog';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { useAuth } from '@/store/context/auth.context';
import { OnboardingShell } from './OnboardingShell';
import { CompanyStep } from './steps/CompanyStep';
import { ResourcesStep } from './steps/ResourcesStep';
import { IdealClientsStep } from './steps/IdealClientsStep';
import { useCompleteOnboarding } from './hooks/useCompleteOnboarding';
import { useOnboardingState } from './hooks/useOnboardingState';
import { useSaveOnboardingProgress } from './hooks/useSaveOnboardingProgress';
import useGenerateOnboardingProfile from './hooks/useGenerateOnboardingProfile';
import useGenerateOnboardingIcps from './hooks/useGenerateOnboardingIcps';

const MAX_ICPS = 3;
const AUTOSAVE_DELAY_MS = 800;

const STEPS: ReadonlyArray<
  Readonly<{ name: string; title: string; subtitle: string }>
> = [
  {
    name: 'Company',
    title: 'Your company',
    subtitle: 'The agent uses this to speak on your behalf, accurately.',
  },
  {
    name: 'Resources',
    title: 'Your resources',
    subtitle: 'What the agent will read to understand your offer.',
  },
  {
    name: 'Ideal clients',
    title: 'Your ideal clients',
    subtitle:
      'Let the AI draft them from your site, then adjust what matters.',
  },
];

const INITIAL_DRAFT: CompleteOnboardingDto = {
  market: { name: 'United States', country: 'US', outreachLanguage: 'en' },
  companyName: '',
  website: '',
  productPageUrl: '',
  salesDeckUrl: '',
  companyProfile: '',
  icps: [],
};

const createIcp = (name: string): IcpDraft => ({
  name,
  archetype: '',
  description: '',
  perceivedValue: '',
  angle: '',
  goldenRule: '',
});

const isFilled = (value: string): boolean => value.trim().length > 0;

const clampStep = (step: number): number =>
  Math.min(Math.max(step, 0), STEPS.length - 1);

const Onboarding = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<CompleteOnboardingDto>(INITIAL_DRAFT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    captureFunnelPageview();
  }, []);

  const { onFetch: completeFetch, isLoading: isCompleting } =
    useCompleteOnboarding();
  const { onFetch: saveProgress } = useSaveOnboardingProgress();
  const { onFetch: generateProfile, isLoading: generatingProfile } =
    useGenerateOnboardingProfile({
      onGenerated: (companyProfile) => setField({ companyProfile }),
    });
  const { onFetch: generateIcps, isLoading: generatingIcps } =
    useGenerateOnboardingIcps({
      onGenerated: (icps) => setField({ icps }),
    });

  const onLoaded = (state: OnboardingStateDto) => {
    if (state.status === 'completed') {
      dispatch({ type: 'ONBOARDING_COMPLETED' });
      navigate('/app', { replace: true });
      return;
    }
    setDraft(state.draft);
    setStepIndex(clampStep(state.step));
    setHydrated(true);
  };

  const onFailed = () => setHydrated(true);

  const { status } = useOnboardingState({ onLoaded, onFailed });

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(
      () => saveProgress({ step: stepIndex, draft }),
      AUTOSAVE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [draft, stepIndex, hydrated]);

  const setField = (patch: Partial<CompleteOnboardingDto>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const addIcp = (name: string) =>
    setDraft((current) => ({
      ...current,
      icps: [...current.icps, createIcp(name)],
    }));

  const removeIcp = (index: number) =>
    setDraft((current) => ({
      ...current,
      icps: current.icps.filter((_, position) => position !== index),
    }));

  const updateIcp = (index: number, patch: Partial<IcpDraft>) =>
    setDraft((current) => ({
      ...current,
      icps: current.icps.map((icp, position) =>
        position === index ? { ...icp, ...patch } : icp,
      ),
    }));

  const canContinue = (() => {
    switch (stepIndex) {
      case 0:
        return isFilled(draft.companyName) && isFilled(draft.website);
      case 2:
        return (
          draft.icps.length > 0 &&
          draft.icps.every(
            (icp) => isFilled(icp.name) && isFilled(icp.description),
          )
        );
      default:
        return true;
    }
  })();

  const isLastStep = stepIndex === STEPS.length - 1;

  const onBack = () => {
    if (stepIndex === 0) {
      navigate(-1);
      return;
    }
    setStepIndex((current) => current - 1);
  };

  const onContinue = () => {
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }
    completeFetch(draft, { onSuccess: () => navigate('/app') });
  };

  if (status === 'loading') {
    return (
      <div className="dark bg-night-900 relative flex min-h-screen items-center justify-center overflow-hidden">
        <AuthBackground />
        <Loader2 className="text-glass-soft relative z-1 size-6 animate-spin" />
      </div>
    );
  }

  const step = STEPS[stepIndex];

  return (
    <OnboardingShell
      stepIndex={stepIndex}
      stepCount={STEPS.length}
      stepName={step.name}
      stepTitle={step.title}
      stepSubtitle={step.subtitle}
      canContinue={canContinue}
      isLastStep={isLastStep}
      isSubmitting={isCompleting}
      onBack={onBack}
      onContinue={onContinue}
    >
      {stepIndex === 0 && (
        <CompanyStep
          companyName={draft.companyName}
          website={draft.website}
          onChange={setField}
        />
      )}
      {stepIndex === 1 && (
        <ResourcesStep
          productPageUrl={draft.productPageUrl}
          salesDeckUrl={draft.salesDeckUrl}
          companyProfile={draft.companyProfile}
          generating={generatingProfile}
          onChange={setField}
          onGenerate={() =>
            generateProfile({
              market: draft.market,
              companyName: draft.companyName,
              website: draft.website,
              productPageUrl: draft.productPageUrl,
              salesDeckUrl: draft.salesDeckUrl,
            })
          }
        />
      )}
      {stepIndex === 2 && (
        <IdealClientsStep
          icps={draft.icps}
          maxIcps={MAX_ICPS}
          canGenerate={isFilled(draft.website)}
          generating={generatingIcps}
          onAdd={addIcp}
          onRemove={removeIcp}
          onUpdate={updateIcp}
          onGenerate={() =>
            generateIcps({
              market: draft.market,
              companyName: draft.companyName,
              website: draft.website,
              productPageUrl: draft.productPageUrl,
              salesDeckUrl: draft.salesDeckUrl,
              companyProfile: draft.companyProfile,
              count: MAX_ICPS,
            })
          }
        />
      )}
    </OnboardingShell>
  );
};

export default Onboarding;
