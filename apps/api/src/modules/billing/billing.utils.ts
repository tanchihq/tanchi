import type { BillingAccess, BillingUsage } from "@shared/billing";
import type * as ResponseDto from "./dto/response/index.ts";

function toLimit(entitlement: number): number | null {
  return Number.isFinite(entitlement) ? entitlement : null;
}

export function convertBillingAccessToStatusDto(
  access: BillingAccess,
  usage: BillingUsage
): ResponseDto.BillingStatusDto {
  return {
    state: access.state,
    plan: access.plan,
    trialEndsAt: access.trialEndsAt?.toISOString() ?? null,
    periodEndsAt: access.periodEndsAt?.toISOString() ?? null,
    cancelAtPeriodEnd: access.cancelAtPeriodEnd,
    hadSubscription: access.hadSubscription,
    usage: {
      leads: {
        used: usage.leads,
        limit: toLimit(access.entitlements.monthlyLeads),
      },
      chatMessages: {
        used: usage.chatMessages,
        limit: toLimit(access.entitlements.monthlyChatMessages),
      },
    },
  };
}
