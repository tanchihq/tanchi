import type { SuppressionRepository } from "./repository/suppression/suppression.repository.ts";
import {
  DeleteExclusionErrors,
  GetSuppressionErrors,
  ImportSuppressionErrors,
} from "./suppression.errors.ts";
import { EXCLUSION_LIST_LIMIT } from "./suppression.constants.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./suppression.utils.ts";

export class SuppressionService {
  constructor(
    private readonly suppressionRepository: SuppressionRepository
  ) {}

  async importCsv(
    dto: RequestDto.ImportSuppressionDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ImportSuppressionResultDto | ImportSuppressionErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return ImportSuppressionErrors.noActiveOrganization;
    }

    const text = await dto.file.text();
    const emails = utils.extractEmails(text);
    if (emails.length === 0) {
      return ImportSuppressionErrors.noEmailsFound;
    }

    try {
      const imported =
        await this.suppressionRepository.insertPersonExclusions(
          organizationId,
          emails
        );
      return { imported, totalFound: emails.length };
    } catch (error) {
      console.error(
        `[suppression] import failed orgId=${organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return ImportSuppressionErrors.importFailed;
    }
  }

  async getList(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ExclusionListDto | GetSuppressionErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetSuppressionErrors.noActiveOrganization;
    }
    const entries = await this.suppressionRepository.getExclusions(
      organizationId,
      EXCLUSION_LIST_LIMIT
    );
    return entries.map(utils.convertPgExclusionToDto);
  }

  async deleteExclusion(
    id: string,
    activeOrganizationId: string | null | undefined
  ): Promise<void | DeleteExclusionErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return DeleteExclusionErrors.noActiveOrganization;
    }

    try {
      const deleted = await this.suppressionRepository.deleteExclusion(
        organizationId,
        id
      );
      if (deleted === null) return DeleteExclusionErrors.inexistingExclusion;

      if (deleted.scope === "person" && deleted.email !== null) {
        await this.suppressionRepository.clearLeadExclusionByEmail(
          organizationId,
          deleted.email
        );
      }
      if (deleted.scope === "company" && deleted.company_domain !== null) {
        await this.suppressionRepository.clearLeadExclusionByDomain(
          organizationId,
          deleted.company_domain
        );
      }
    } catch (error) {
      console.error(
        `[suppression] deleteExclusion failed orgId=${organizationId} id=${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return DeleteExclusionErrors.deleteFailed;
    }
    return;
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
