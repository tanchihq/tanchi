import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  SOLO_ENTITLEMENTS,
  TRIAL_ENTITLEMENTS,
  UNLIMITED_ENTITLEMENTS,
} from "./constants.ts";

export type Entitlements = Readonly<{
  monthlyLeads: number;
  monthlyChatMessages: number;
  seats: number;
  senders: number;
  icps: number;
}>;

export type BillingState = "unlimited" | "trialing" | "active" | "expired";

export type BillingAccess = Readonly<{
  state: BillingState;
  plan: string | null;
  entitlements: Entitlements;
  trialEndsAt: Date | null;
  periodEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  hadSubscription: boolean;
}>;

export type BillingSubscriptionSnapshot = Readonly<{
  plan: string;
  status: string;
  periodEnd: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}>;

type ResolveBillingStateInput = Readonly<{
  billingEnabled: boolean;
  subscription: BillingSubscriptionSnapshot | null;
  hadSubscription: boolean;
}>;

function isSubscriptionActive(
  subscription: BillingSubscriptionSnapshot
): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.some(
    (status) => status === subscription.status
  );
}

export function resolveBillingAccess(
  input: ResolveBillingStateInput
): BillingAccess {
  if (!input.billingEnabled) {
    return {
      state: "unlimited",
      plan: null,
      entitlements: UNLIMITED_ENTITLEMENTS,
      trialEndsAt: null,
      periodEndsAt: null,
      cancelAtPeriodEnd: false,
      hadSubscription: input.hadSubscription,
    };
  }

  if (
    input.subscription === null ||
    !isSubscriptionActive(input.subscription)
  ) {
    return {
      state: "expired",
      plan: null,
      entitlements: TRIAL_ENTITLEMENTS,
      trialEndsAt: null,
      periodEndsAt: null,
      cancelAtPeriodEnd: false,
      hadSubscription: input.hadSubscription,
    };
  }

  if (input.subscription.status === "trialing") {
    return {
      state: "trialing",
      plan: input.subscription.plan,
      entitlements: TRIAL_ENTITLEMENTS,
      trialEndsAt: input.subscription.trialEnd,
      periodEndsAt: null,
      cancelAtPeriodEnd: input.subscription.cancelAtPeriodEnd,
      hadSubscription: true,
    };
  }

  return {
    state: "active",
    plan: input.subscription.plan,
    entitlements: SOLO_ENTITLEMENTS,
    trialEndsAt: null,
    periodEndsAt: input.subscription.periodEnd,
    cancelAtPeriodEnd: input.subscription.cancelAtPeriodEnd,
    hadSubscription: true,
  };
}
