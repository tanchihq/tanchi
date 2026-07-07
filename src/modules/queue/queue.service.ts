import { recordActivity } from "@shared/activity";
import { decryptSecret } from "@shared/crypto";
import { sendEmail, type MailboxCredentials } from "@shared/mailbox";
import type { QueueRepository } from "./repository/queue/queue.repository.ts";
import type { PgQueueSenderCred } from "./repository/queue/queue.entities.ts";
import {
  EditQueueErrors,
  GetQueueErrors,
  ValidateQueueErrors,
} from "./queue.errors.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./queue.utils.ts";

function toCredentials(sender: PgQueueSenderCred): MailboxCredentials {
  return {
    smtpHost: sender.smtp_host,
    smtpPort: sender.smtp_port,
    smtpSecure: sender.smtp_secure,
    imapHost: sender.imap_host,
    imapPort: sender.imap_port,
    imapSecure: sender.imap_secure,
    username: sender.username,
    secret: decryptSecret(sender.secret_encrypted),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class QueueService {
  constructor(private readonly queueRepository: QueueRepository) {}

  async getQueue(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.QueueDto | GetQueueErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetQueueErrors.noActiveOrganization;
    }

    const rows =
      await this.queueRepository.getQueueRowsByOrganization(organizationId);
    const leadIds = rows.map((row) => row.lead_id);
    const facts = await this.queueRepository.getFactsForLeads(leadIds);

    const items = rows.map((row) =>
      utils.convertToQueueItemDto(
        row,
        facts.filter((fact) => fact.lead_id === row.lead_id)
      )
    );
    const first = rows[0];
    const preparedAt =
      first === undefined ? null : first.message_created_at.toISOString();

    return { preparedAt, items };
  }

  async editQueue(
    leadId: string,
    dto: RequestDto.EditQueueDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.QueueItemDto | EditQueueErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return EditQueueErrors.noActiveOrganization;
    }

    const row = await this.queueRepository.getOneQueueRowByLead(leadId);
    if (row === null) return EditQueueErrors.inexistingDraft;
    if (row.organization_id !== organizationId) {
      return EditQueueErrors.notInMyOrg;
    }

    try {
      await this.queueRepository.applyEdit({
        organizationId,
        messageId: row.message_id,
        aiVersion: row.body,
        editedVersion: dto.message,
      });
    } catch (error) {
      console.error(
        `[queue] editQueue failed leadId=${leadId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return EditQueueErrors.editFailed;
    }

    const refreshed = await this.queueRepository.getOneQueueRowByLead(leadId);
    if (refreshed === null) return EditQueueErrors.inexistingDraft;
    const facts = await this.queueRepository.getFactsForLeads([leadId]);
    return utils.convertToQueueItemDto(refreshed, facts);
  }

  async validateQueueItem(
    leadId: string,
    activeOrganizationId: string | null | undefined,
    senderId: string | undefined
  ): Promise<ResponseDto.QueueItemDto | ValidateQueueErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return ValidateQueueErrors.noActiveOrganization;
    }

    const row = await this.queueRepository.getOneQueueRowByLead(leadId);
    if (row === null) return ValidateQueueErrors.inexistingDraft;
    if (row.organization_id !== organizationId) {
      return ValidateQueueErrors.notInMyOrg;
    }

    if (row.channel === "email" && row.email !== null) {
      const sender =
        senderId === undefined
          ? await this.queueRepository.getFirstActiveSenderByOrganization(
              organizationId
            )
          : await this.queueRepository.getActiveSenderById(
              organizationId,
              senderId
            );
      if (sender === null) return ValidateQueueErrors.noSender;
      try {
        await sendEmail(toCredentials(sender), {
          fromName: sender.from_name,
          fromEmail: sender.from_email,
          to: row.email,
          subject: row.subject ?? "",
          text:
            sender.signature === ""
              ? row.body
              : `${row.body}\n\n${sender.signature}`,
        });
      } catch (error) {
        console.error(
          `[queue] validate send failed leadId=${leadId}: ${errorMessage(error)}`
        );
        return ValidateQueueErrors.sendFailed;
      }
      await this.queueRepository.markSentAndAdvance({
        organizationId,
        messageId: row.message_id,
        leadId,
        senderId: sender.id,
      });
      await recordActivity({
        organizationId,
        type: "sent",
        title: `Email sent to ${row.email}`,
        leadId,
      });
    } else {
      await this.queueRepository.markSentAndAdvance({
        organizationId,
        messageId: row.message_id,
        leadId,
        senderId: null,
      });
    }

    const facts = await this.queueRepository.getFactsForLeads([leadId]);
    return { ...utils.convertToQueueItemDto(row, facts), done: true };
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
