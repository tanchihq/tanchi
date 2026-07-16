import { describe, expect, it } from "bun:test";
import { resolveBillingAccess } from "../../src/shared/billing/entitlements.ts";
import {
  SOLO_ENTITLEMENTS,
  TRIAL_ENTITLEMENTS,
} from "../../src/shared/billing/constants.ts";

const TRIAL_END = new Date("2026-07-29T12:00:00Z");
const PERIOD_END = new Date("2026-08-01T00:00:00Z");

describe("resolveBillingAccess", () => {
  it("returns unlimited access when billing is disabled", () => {
    const access = resolveBillingAccess({
      billingEnabled: false,
      subscription: null,
      hadSubscription: false,
    });
    expect(access.state).toBe("unlimited");
    expect(access.entitlements.monthlyLeads).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns active access with solo entitlements for an active subscription", () => {
    const access = resolveBillingAccess({
      billingEnabled: true,
      subscription: {
        plan: "solo",
        status: "active",
        periodEnd: PERIOD_END,
        trialEnd: null,
        cancelAtPeriodEnd: false,
      },
      hadSubscription: true,
    });
    expect(access.state).toBe("active");
    expect(access.plan).toBe("solo");
    expect(access.entitlements).toEqual(SOLO_ENTITLEMENTS);
    expect(access.periodEndsAt).toEqual(PERIOD_END);
  });

  it("returns trialing with trial entitlements for a stripe trialing subscription", () => {
    const access = resolveBillingAccess({
      billingEnabled: true,
      subscription: {
        plan: "solo",
        status: "trialing",
        periodEnd: null,
        trialEnd: TRIAL_END,
        cancelAtPeriodEnd: false,
      },
      hadSubscription: true,
    });
    expect(access.state).toBe("trialing");
    expect(access.entitlements).toEqual(TRIAL_ENTITLEMENTS);
    expect(access.trialEndsAt).toEqual(TRIAL_END);
  });

  it("returns expired when the organization never subscribed", () => {
    const access = resolveBillingAccess({
      billingEnabled: true,
      subscription: null,
      hadSubscription: false,
    });
    expect(access.state).toBe("expired");
    expect(access.hadSubscription).toBe(false);
  });

  it("returns expired for a canceled subscription", () => {
    const access = resolveBillingAccess({
      billingEnabled: true,
      subscription: {
        plan: "solo",
        status: "canceled",
        periodEnd: new Date("2026-06-01T00:00:00Z"),
        trialEnd: null,
        cancelAtPeriodEnd: false,
      },
      hadSubscription: true,
    });
    expect(access.state).toBe("expired");
    expect(access.hadSubscription).toBe(true);
  });

  it("keeps cancelAtPeriodEnd visible on a trialing subscription", () => {
    const access = resolveBillingAccess({
      billingEnabled: true,
      subscription: {
        plan: "solo",
        status: "trialing",
        periodEnd: null,
        trialEnd: TRIAL_END,
        cancelAtPeriodEnd: true,
      },
      hadSubscription: true,
    });
    expect(access.state).toBe("trialing");
    expect(access.cancelAtPeriodEnd).toBe(true);
  });
});
