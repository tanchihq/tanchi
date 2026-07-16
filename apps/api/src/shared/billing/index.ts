import { db } from "../../db.ts";
import { isBillingEnabled } from "../../env.ts";
import type {
  BillingAccess,
  BillingSubscriptionSnapshot,
  Entitlements,
} from "./entitlements.ts";
import { resolveBillingAccess } from "./entitlements.ts";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "./constants.ts";

export type UsageMetric = "leads" | "chat_messages";

export type BillingUsage = Readonly<{
  leads: number;
  chatMessages: number;
}>;

type PgSubscriptionSnapshot = Readonly<{
  plan: string;
  status: string;
  period_end: Date | null;
  trial_end: Date | null;
  cancel_at_period_end: boolean;
}>;

type PgSubscriptionCount = Readonly<{ count: string }>;

type PgUsageRow = Readonly<{ metric: string; used: number }>;

async function getActiveSubscription(
  organizationId: string
): Promise<BillingSubscriptionSnapshot | null> {
  const rows = await db<ReadonlyArray<PgSubscriptionSnapshot>>`
    SELECT plan, status, period_end, trial_end, cancel_at_period_end
    FROM subscription
    WHERE reference_id = ${organizationId}
      AND status = ANY(${[...ACTIVE_SUBSCRIPTION_STATUSES]})
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (row === undefined) return null;
  return {
    plan: row.plan,
    status: row.status,
    periodEnd: row.period_end,
    trialEnd: row.trial_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}

async function hasAnySubscription(organizationId: string): Promise<boolean> {
  const rows = await db<ReadonlyArray<PgSubscriptionCount>>`
    SELECT COUNT(*) AS count
    FROM subscription
    WHERE reference_id = ${organizationId}
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}

export async function getBillingAccess(
  organizationId: string
): Promise<BillingAccess> {
  if (!isBillingEnabled) {
    return resolveBillingAccess({
      billingEnabled: false,
      subscription: null,
      hadSubscription: false,
    });
  }
  const [subscription, hadSubscription] = await Promise.all([
    getActiveSubscription(organizationId),
    hasAnySubscription(organizationId),
  ]);
  return resolveBillingAccess({
    billingEnabled: true,
    subscription,
    hadSubscription,
  });
}

export async function getMonthlyUsage(
  organizationId: string
): Promise<BillingUsage> {
  const rows = await db<ReadonlyArray<PgUsageRow>>`
    SELECT metric, used
    FROM usage_counters
    WHERE organization_id = ${organizationId}
      AND period = to_char(NOW(), 'YYYY-MM')
  `;
  const byMetric = new Map(rows.map((row) => [row.metric, row.used]));
  return {
    leads: byMetric.get("leads") ?? 0,
    chatMessages: byMetric.get("chat_messages") ?? 0,
  };
}

export async function incrementMonthlyUsage(
  organizationId: string,
  metric: UsageMetric,
  amount: number
): Promise<void> {
  if (!isBillingEnabled || amount <= 0) return;
  await db`
    INSERT INTO usage_counters (organization_id, period, metric, used)
    VALUES (${organizationId}, to_char(NOW(), 'YYYY-MM'), ${metric}, ${amount})
    ON CONFLICT (organization_id, period, metric)
    DO UPDATE SET used = usage_counters.used + EXCLUDED.used, updated_at = NOW()
  `;
}

export async function getRemainingMonthlyLeads(
  organizationId: string,
  entitlements: Entitlements
): Promise<number> {
  if (!isBillingEnabled) return Number.POSITIVE_INFINITY;
  const usage = await getMonthlyUsage(organizationId);
  return Math.max(0, entitlements.monthlyLeads - usage.leads);
}

export type {
  BillingAccess,
  BillingState,
  Entitlements,
} from "./entitlements.ts";
export { resolveBillingAccess } from "./entitlements.ts";
export {
  SOLO_PLAN_NAME,
  SOLO_ENTITLEMENTS,
  TRIAL_DURATION_DAYS,
  TRIAL_ENTITLEMENTS,
} from "./constants.ts";
