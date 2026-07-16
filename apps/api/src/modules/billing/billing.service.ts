import { getBillingAccess, getMonthlyUsage } from "@shared/billing";
import { GetBillingStatusErrors } from "./billing.errors.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./billing.utils.ts";

export class BillingService {
  async getStatus(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.BillingStatusDto | GetBillingStatusErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetBillingStatusErrors.noActiveOrganization;
    }

    const [access, usage] = await Promise.all([
      getBillingAccess(organizationId),
      getMonthlyUsage(organizationId),
    ]);
    return utils.convertBillingAccessToStatusDto(access, usage);
  }
}

function resolveActiveOrganization(
  activeOrganizationId: string | null | undefined
): string | null {
  if (
    activeOrganizationId === null ||
    activeOrganizationId === undefined ||
    activeOrganizationId === ""
  ) {
    return null;
  }
  return activeOrganizationId;
}
