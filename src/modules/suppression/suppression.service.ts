import type { SuppressionRepository } from "./repository/suppression/suppression.repository.ts";
import {
  GetSuppressionErrors,
  ImportSuppressionErrors,
} from "./suppression.errors.ts";
import { SUPPRESSION_LIST_LIMIT } from "./suppression.constants.ts";
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
      const imported = await this.suppressionRepository.insertSuppressions(
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
  ): Promise<ResponseDto.SuppressionListDto | GetSuppressionErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetSuppressionErrors.noActiveOrganization;
    }
    const entries = await this.suppressionRepository.getSuppressionList(
      organizationId,
      SUPPRESSION_LIST_LIMIT
    );
    return entries.map(utils.convertPgSuppressionToDto);
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
