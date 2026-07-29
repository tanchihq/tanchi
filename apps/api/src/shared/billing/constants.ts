import type { Entitlements } from "./entitlements.ts";

export const SOLO_PLAN_NAME = "solo";

export const TRIAL_DURATION_DAYS = 14;

export const SOLO_ENTITLEMENTS: Entitlements = {
  monthlyLeads: 200,
  monthlyChatMessages: 150,
  seats: 1,
  senders: Number.POSITIVE_INFINITY,
  icps: 3,
  markets: Number.POSITIVE_INFINITY,
};

export const TRIAL_ENTITLEMENTS: Entitlements = {
  monthlyLeads: 50,
  monthlyChatMessages: 50,
  seats: 1,
  senders: Number.POSITIVE_INFINITY,
  icps: 3,
  markets: Number.POSITIVE_INFINITY,
};

export const UNLIMITED_ENTITLEMENTS: Entitlements = {
  monthlyLeads: Number.POSITIVE_INFINITY,
  monthlyChatMessages: Number.POSITIVE_INFINITY,
  seats: Number.POSITIVE_INFINITY,
  senders: Number.POSITIVE_INFINITY,
  icps: Number.POSITIVE_INFINITY,
  markets: Number.POSITIVE_INFINITY,
};

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
