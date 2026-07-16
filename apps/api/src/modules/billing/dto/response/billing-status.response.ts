export type BillingUsageEntryDto = Readonly<{
  used: number;
  limit: number | null;
}>;

export type BillingStatusDto = Readonly<{
  state: "unlimited" | "trialing" | "active" | "expired";
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
