import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/context/auth.context';
import { type BillingStatusDto } from '@/api/billing/entities/billing.entities';
import SettingsSection from '../settings-section/SettingsSection';
import useRetrieveBillingStatus from './hooks/useRetrieveBillingStatus';
import useSubscribe from './hooks/useSubscribe';
import useCancelSubscription from './hooks/useCancelSubscription';
import useRestoreSubscription from './hooks/useRestoreSubscription';
import { statusHeadline } from './utils';

type UsageRowProps = Readonly<{
  label: string;
  used: number;
  limit: number | null;
}>;

const UsageRow = ({ label, used, limit }: UsageRowProps) => {
  const ratio =
    limit === null || limit === 0 ? 0 : Math.min(1, used / limit);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-app-soft">{label}</span>
        <span className="text-app-fg">
          {limit === null ? `${used}` : `${used} / ${limit}`}
        </span>
      </div>
      {limit !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-app-hover">
          <div
            className={
              ratio >= 1
                ? 'h-full rounded-full bg-app-danger-fg'
                : 'h-full rounded-full bg-brand'
            }
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

type BillingActionsProps = Readonly<{
  billing: BillingStatusDto;
  organizationId: string;
  onRestored: () => void;
}>;

const BillingActions = ({
  billing,
  organizationId,
  onRestored,
}: BillingActionsProps) => {
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();
  const restore = useRestoreSubscription({ onRestored });

  if (billing.state === 'expired') {
    return (
      <Button
        type="button"
        isLoading={subscribe.isLoading}
        onClick={() => subscribe.onFetch(organizationId)}
      >
        Subscribe
      </Button>
    );
  }
  if (billing.cancelAtPeriodEnd) {
    return (
      <Button
        type="button"
        variant="outline"
        isLoading={restore.isLoading}
        onClick={() => restore.onFetch(organizationId)}
      >
        Resume subscription
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      isLoading={cancel.isLoading}
      onClick={() => cancel.onFetch(organizationId)}
    >
      Manage subscription
    </Button>
  );
};

const BillingSection = () => {
  const { state } = useAuth();
  const { data: billing, status, refetch } = useRetrieveBillingStatus();
  const organizationId = state.user?.activeOrganizationId ?? null;

  if (
    status !== 'success' ||
    billing.state === 'unlimited' ||
    organizationId === null
  ) {
    return null;
  }

  return (
    <SettingsSection title="Subscription">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p
              className={
                billing.state === 'expired'
                  ? 'text-sm font-medium text-app-danger-fg'
                  : 'text-sm font-medium text-app-fg'
              }
            >
              {statusHeadline(billing)}
            </p>
            <p className="text-xs leading-relaxed text-app-faint">
              {billing.state === 'expired'
                ? 'Sourcing, research and drafting are paused. Your data and pending drafts stay available.'
                : 'Monthly usage resets on the 1st.'}
            </p>
          </div>
          <BillingActions
            billing={billing}
            organizationId={organizationId}
            onRestored={refetch}
          />
        </div>
        <div className="flex flex-col gap-3">
          <UsageRow
            label="Prospects sourced this month"
            used={billing.usage.leads.used}
            limit={billing.usage.leads.limit}
          />
          <UsageRow
            label="Copilot messages this month"
            used={billing.usage.chatMessages.used}
            limit={billing.usage.chatMessages.limit}
          />
        </div>
      </div>
    </SettingsSection>
  );
};

export default BillingSection;
