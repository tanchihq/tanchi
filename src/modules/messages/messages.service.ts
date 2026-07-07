import type { MessagesRepository } from "./repository/messages/messages.repository.ts";
import { GetMessagesErrors } from "./messages.errors.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./messages.utils.ts";

export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  async getMessages(
    dto: RequestDto.GetMessagesDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.MessageHistoryListDto | GetMessagesErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetMessagesErrors.noActiveOrganization;
    }

    const rows = await this.messagesRepository.getMessages({
      organizationId,
      limit: dto.limit,
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.leadId !== undefined && { leadId: dto.leadId }),
    });
    return rows.map(utils.convertPgMessageHistoryRowToDto);
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
