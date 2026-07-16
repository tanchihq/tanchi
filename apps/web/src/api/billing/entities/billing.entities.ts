export type BillingUsageEntryDto = Readonly<{
  used: number;
  limit: number | null;
}>;

export type BillingState = 'unlimited' | 'trialing' | 'active' | 'expired';

export type BillingStatusDto = Readonly<{
  state: BillingState;
  plan: string | null;
  trialEndsAt: string | null;
  periodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  hadSubscription: boolean;
  usage: Readonly<{
    leads: BillingUsageEntryDto;
    chatMessages: BillingUsageEntryDto;
  }>;
}>;
