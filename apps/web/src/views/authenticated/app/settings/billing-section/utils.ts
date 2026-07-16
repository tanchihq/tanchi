import { type BillingStatusDto } from '@/api/billing/entities/billing.entities';

export const formatBillingDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const statusHeadline = (billing: BillingStatusDto): string => {
  switch (billing.state) {
    case 'trialing':
      return billing.trialEndsAt === null
        ? 'Free trial'
        : `Free trial — ends ${formatBillingDate(billing.trialEndsAt)}`;
    case 'active':
      if (billing.cancelAtPeriodEnd) {
        return billing.periodEndsAt === null
          ? 'Solo plan — cancels at period end'
          : `Solo plan — ends ${formatBillingDate(billing.periodEndsAt)}`;
      }
      return billing.periodEndsAt === null
        ? 'Solo plan'
        : `Solo plan — renews ${formatBillingDate(billing.periodEndsAt)}`;
    case 'expired':
      return 'No active subscription — engine paused';
    case 'unlimited':
      return 'Self-hosted — no limits';
  }
};
