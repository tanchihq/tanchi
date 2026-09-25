import { recordActivity } from "@shared/activity";
import { decryptSecret } from "@shared/crypto";
import { sendEmail, type MailboxCredentials } from "@shared/mailbox";
import type { QueueRepository } from "./repository/queue/queue.repository.ts";
import type {
  PgQueueRow,
  PgQueueSenderCred,
} from "./repository/queue/queue.entities.ts";
import {
  EditQueueErrors,
  GetQueueErrors,
  SkipQueueErrors,
  ValidateQueueErrors,
} from "./queue.errors.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./queue.utils.ts";

type DeliveryResult =
  | Readonly<{ ok: true; senderId: string | null; emailMessageId: string | null }>
  | Readonly<{ ok: false; error: ValidateQueueErrors }>;

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

function appendSignature(body: string, signature: string): string {
  return signature === "" ? body : `${body}\n\n${signature}`;
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

    const [rows, autopilotEnabled] = await Promise.all([
      this.queueRepository.getQueueRowsByOrganization(organizationId),
      this.queueRepository.isAutopilotEnabled(organizationId),
    ]);
    const facts = await this.queueRepository.getFactsForLeads(
      rows.map((row) => row.lead_id)
    );

    return {
      preparedAt: utils.latestPreparedAt(rows),
      autopilotEnabled,
      items: rows.map((row) =>
        utils.convertToQueueItemDto(
          row,
          facts.filter((fact) => fact.lead_id === row.lead_id),
          autopilotEnabled
        )
      ),
    };
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
        ...(dto.subject !== undefined && { subject: dto.subject }),
      });
    } catch (error) {
      console.error(
        `[queue] editQueue failed leadId=${leadId}: ${errorMessage(error)}`
      );
      return EditQueueErrors.editFailed;
    }

    const refreshed = await this.queueRepository.getOneQueueRowByLead(leadId);
    if (refreshed === null) return EditQueueErrors.inexistingDraft;
    return this.toItem(refreshed, organizationId);
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

    const claimed = await this.queueRepository.claimDraft(
      organizationId,
      row.message_id
    );
    if (!claimed) return ValidateQueueErrors.inexistingDraft;

    const delivery = await this.deliver(row, organizationId, senderId);
    if (!delivery.ok) {
      await this.queueRepository.releaseDraft(organizationId, row.message_id);
      return delivery.error;
    }

    await this.queueRepository.markSentAndAdvance({
      organizationId,
      messageId: row.message_id,
      leadId,
      senderId: delivery.senderId,
      emailMessageId: delivery.emailMessageId,
    });
    if (delivery.emailMessageId !== null && row.email !== null) {
      await recordActivity({
        organizationId,
        type: "sent",
        title: `Email sent to ${row.email}`,
        leadId,
      });
    }

    const item = await this.toItem(row, organizationId);
    return { ...item, done: true };
  }

  async skipQueueItem(
    leadId: string,
    dto: RequestDto.SkipQueueDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.QueueSkipResultDto | SkipQueueErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return SkipQueueErrors.noActiveOrganization;
    }

    const row = await this.queueRepository.getOneQueueRowByLead(leadId);
    if (row === null) return SkipQueueErrors.inexistingDraft;
    if (row.organization_id !== organizationId) {
      return SkipQueueErrors.notInMyOrg;
    }

    const reason = dto.reason ?? null;
    try {
      const skipped = await this.queueRepository.skipDraft({
        organizationId,
        messageId: row.message_id,
        leadId,
        email: row.email,
        reason,
      });
      if (!skipped) return SkipQueueErrors.inexistingDraft;
    } catch (error) {
      console.error(
        `[queue] skipQueueItem failed leadId=${leadId}: ${errorMessage(error)}`
      );
      return SkipQueueErrors.skipFailed;
    }

    return {
      id: leadId,
      messageId: row.message_id,
      reason,
      nextStep: utils.nextStepAfterSkip(reason),
    };
  }

  private async deliver(
    row: PgQueueRow,
    organizationId: string,
    senderId: string | undefined
  ): Promise<DeliveryResult> {
    if (row.channel !== "email" || row.email === null) {
      return { ok: true, senderId: null, emailMessageId: null };
    }

    const sender = await this.pickSender(organizationId, row.lead_id, senderId);
    if (sender === null) return { ok: false, error: ValidateQueueErrors.noSender };

    const thread = await this.queueRepository.getThreadMessageIds(
      organizationId,
      row.lead_id
    );
    try {
      const sent = await sendEmail(toCredentials(sender), {
        fromName: sender.from_name,
        fromEmail: sender.from_email,
        to: row.email,
        subject: row.subject ?? "",
        text: appendSignature(row.body, sender.signature),
        inReplyTo: thread.at(-1) ?? null,
        references: thread,
      });
      return { ok: true, senderId: sender.id, emailMessageId: sent.messageId };
    } catch (error) {
      console.error(
        `[queue] validate send failed leadId=${row.lead_id}: ${errorMessage(error)}`
      );
      return { ok: false, error: ValidateQueueErrors.sendFailed };
    }
  }

  private async pickSender(
    organizationId: string,
    leadId: string,
    senderId: string | undefined
  ): Promise<PgQueueSenderCred | null> {
    if (senderId !== undefined) {
      return this.queueRepository.getActiveSenderById(organizationId, senderId);
    }
    const previous = await this.queueRepository.getLastActiveSenderForLead(
      organizationId,
      leadId
    );
    return (
      previous ??
      this.queueRepository.getFirstActiveSenderByOrganization(organizationId)
    );
  }

  private async toItem(
    row: PgQueueRow,
    organizationId: string
  ): Promise<ResponseDto.QueueItemDto> {
    const [facts, autopilotEnabled] = await Promise.all([
      this.queueRepository.getFactsForLeads([row.lead_id]),
      this.queueRepository.isAutopilotEnabled(organizationId),
    ]);
    return utils.convertToQueueItemDto(row, facts, autopilotEnabled);
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
