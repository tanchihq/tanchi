import type { LearningsRepository } from "./repository/learnings/learnings.repository.ts";
import { GetLearningsErrors } from "./learnings.errors.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./learnings.utils.ts";

export class LearningsService {
  constructor(private readonly learningsRepository: LearningsRepository) {}

  async getLearnings(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.LearningsDto | GetLearningsErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetLearningsErrors.noActiveOrganization;
    }

    const learnings =
      await this.learningsRepository.getIcpLearningsByOrganization(
        organizationId
      );
    return learnings.map(utils.convertPgIcpLearningToLearningDto);
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
