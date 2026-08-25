import { type ReactNode } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/context/auth.context';
import useRetrieveBillingStatus from './hooks/useRetrieveBillingStatus';
import useSubscribe from './hooks/useSubscribe';

type Properties = Readonly<{ children: ReactNode }>;

const BillingGate = ({ children }: Properties) => {
  const { state } = useAuth();
  const { data: billing, status } = useRetrieveBillingStatus();
  const subscribe = useSubscribe();
  const organizationId = state.user?.activeOrganizationId ?? null;

  const blocked =
    status === 'success' &&
    billing.state === 'expired' &&
    organizationId !== null;

  if (!blocked) {
    return <>{children}</>;
  }

  const firstVisit = !billing.hadSubscription;

  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="glass-card flex w-full max-w-md flex-col items-center gap-5 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-app-hover">
          <CreditCard size={22} className="text-app-fg" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-app-fg">
            {firstVisit ? 'Start your 14-day free trial' : 'Your subscription has ended'}
          </h2>
          <p className="text-sm leading-relaxed text-app-soft">
            {firstVisit
              ? "Add your payment details to activate Tanchi. You won't be charged before your trial ends, and you can cancel anytime."
              : 'Update your billing information to resume prospecting and outreach. Your data and pending drafts are safe.'}
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          isLoading={subscribe.isLoading}
          onClick={() => subscribe.onFetch(organizationId)}
        >
          {firstVisit ? 'Start free trial' : 'Update billing'}
        </Button>
      </div>
    </div>
  );
};

export default BillingGate;
