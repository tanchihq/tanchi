import type { MessagesRepository } from "./repository/messages/messages.repository.ts";
import { EditMessageErrors, GetMessagesErrors } from "./messages.errors.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./messages.utils.ts";

const EDITABLE_STATUSES: ReadonlyArray<string> = ["draft", "edited"];

export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  async editMessage(
    id: string,
    dto: RequestDto.EditMessageDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.EditedMessageDto | EditMessageErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return EditMessageErrors.noActiveOrganization;
    }

    const message = await this.messagesRepository.getEditableMessageById(id);
    if (message === null) return EditMessageErrors.inexistingMessage;
    if (message.organization_id !== organizationId) {
      return EditMessageErrors.notInMyOrg;
    }
    if (!EDITABLE_STATUSES.includes(message.status)) {
      return EditMessageErrors.notEditable;
    }

    const subject = dto.subject === undefined ? message.subject : dto.subject;
    const original =
      await this.messagesRepository.getOriginalAiVersion(id);
    const aiVersion = original ?? message.body;

    try {
      const updated = await this.messagesRepository.saveMessageEdit({
        organizationId,
        messageId: id,
        aiVersion,
        subject,
        body: dto.body,
      });
      if (updated === null) return EditMessageErrors.inexistingMessage;
      return utils.convertPgEditableMessageToDto(updated);
    } catch (error) {
      console.error(
        `[messages] editMessage failed messageId=${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return EditMessageErrors.updateFailed;
    }
  }

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
