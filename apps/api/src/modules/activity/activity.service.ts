import type { ActivityRepository } from "./repository/activity/activity.repository.ts";
import { GetActivityErrors } from "./activity.errors.ts";
import { NIGHTLY_RUN_HOUR } from "./activity.constants.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./activity.utils.ts";

function nextNightlyRun(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(NIGHTLY_RUN_HOUR, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async getActivity(
    dto: RequestDto.GetActivityDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ActivityListDto | GetActivityErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetActivityErrors.noActiveOrganization;
    }
    const activity = await this.activityRepository.getRecentActivity(
      organizationId,
      dto.limit
    );
    return activity.map(utils.convertPgActivityToItemDto);
  }

  async getStatus(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ActivityStatusDto | GetActivityErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetActivityErrors.noActiveOrganization;
    }
    const row = await this.activityRepository.getStatusRow(organizationId);
    return utils.buildStatusDto(row, nextNightlyRun());
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
