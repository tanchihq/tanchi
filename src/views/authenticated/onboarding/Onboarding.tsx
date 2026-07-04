import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  type CompleteOnboardingDto,
  type IcpDraft,
} from '@/api/onboarding/entities/request.entities';
import { type OnboardingStateDto } from '@/api/onboarding/entities/response.entities';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { useAuth } from '@/store/context/auth.context';
import { OnboardingShell } from './OnboardingShell';
import { CompanyStep } from './steps/CompanyStep';
import { ResourcesStep } from './steps/ResourcesStep';
import { TargetsStep } from './steps/TargetsStep';
import { IdealClientsStep } from './steps/IdealClientsStep';
import { useCompleteOnboarding } from './hooks/useCompleteOnboarding';
import { useOnboardingState } from './hooks/useOnboardingState';
import { useSaveOnboardingProgress } from './hooks/useSaveOnboardingProgress';

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
    name: 'Targets',
    title: 'Your targets',
    subtitle: 'Define 1 to 3 profiles. The agent will prioritize them.',
  },
  {
    name: 'Ideal clients',
    title: 'Your ideal clients',
    subtitle:
      'Detail each profile. The agent personalizes and picks the angle from these.',
  },
];

const INITIAL_DRAFT: CompleteOnboardingDto = {
  companyName: '',
  website: '',
  productPageUrl: '',
  salesDeckUrl: '',
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

  const { onFetch: completeFetch, isLoading: isCompleting } =
    useCompleteOnboarding();
  const { onFetch: saveProgress } = useSaveOnboardingProgress();

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

  // Si l'état ne peut pas être récupéré, on démarre un onboarding vierge.
  const onFailed = () => setHydrated(true);

  const { status } = useOnboardingState({ onLoaded, onFailed });

  // Autosave debounced du brouillon dès qu'il change (une fois hydraté).
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
        return draft.icps.length > 0;
      case 3:
        return draft.icps.every(
          (icp) => isFilled(icp.name) && isFilled(icp.description),
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
      <div className="bg-night-900 relative flex min-h-screen items-center justify-center overflow-hidden">
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
          onChange={setField}
        />
      )}
      {stepIndex === 2 && (
        <TargetsStep
          icps={draft.icps}
          maxIcps={MAX_ICPS}
          onAdd={addIcp}
          onRemove={removeIcp}
        />
      )}
      {stepIndex === 3 && (
        <IdealClientsStep icps={draft.icps} onUpdate={updateIcp} />
      )}
    </OnboardingShell>
  );
};

export default Onboarding;
