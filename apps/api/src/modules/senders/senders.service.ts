import { getBillingAccess } from "@shared/billing";
import { decryptSecret, encryptSecret } from "@shared/crypto";
import {
  isAllowedImapPort,
  isAllowedSmtpPort,
  verifyMailbox,
} from "@shared/mailbox";
import { isPublicHost } from "@shared/web";
import type { SendersRepository } from "./repository/senders/senders.repository.ts";
import type { PgSender } from "./repository/senders/senders.entities.ts";
import {
  CreateSenderErrors,
  DeleteSenderErrors,
  ListSendersErrors,
  TestSenderErrors,
  UpdateSenderErrors,
} from "./senders.errors.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./senders.utils.ts";

export class SendersService {
  constructor(private readonly sendersRepository: SendersRepository) {}

  async createSender(
    dto: RequestDto.CreateSenderDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.SenderDto | CreateSenderErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return CreateSenderErrors.noActiveOrganization;
    }

    if (!isAllowedSmtpPort(dto.smtpPort) || !isAllowedImapPort(dto.imapPort)) {
      return CreateSenderErrors.invalidPort;
    }
    if (
      !(await isPublicHost(dto.smtpHost)) ||
      !(await isPublicHost(dto.imapHost))
    ) {
      return CreateSenderErrors.invalidHost;
    }

    const access = await getBillingAccess(organizationId);
    if (access.state === "expired") {
      return CreateSenderErrors.subscriptionExpired;
    }
    if (Number.isFinite(access.entitlements.senders)) {
      const existing =
        await this.sendersRepository.getManySendersByOrganization(
          organizationId
        );
      if (existing.length >= access.entitlements.senders) {
        return CreateSenderErrors.senderLimitReached;
      }
    }

    try {
      const sender = await this.sendersRepository.createOneSender({
        organizationId,
        fromName: dto.fromName,
        fromEmail: dto.fromEmail,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        smtpSecure: dto.smtpSecure,
        imapHost: dto.imapHost,
        imapPort: dto.imapPort,
        imapSecure: dto.imapSecure,
        username: dto.username,
        secretEncrypted: encryptSecret(dto.secret),
        dailyCap: dto.dailyCap,
        signature: dto.signature,
      });
      return utils.convertPgSenderToSenderDto(sender);
    } catch (error) {
      console.error(
        `[senders] createSender failed orgId=${organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return CreateSenderErrors.createFailed;
    }
  }

  async listSenders(
    activeOrganizationId: string | null | undefined
  ): Promise<ReadonlyArray<ResponseDto.SenderDto> | ListSendersErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return ListSendersErrors.noActiveOrganization;
    }
    const senders =
      await this.sendersRepository.getManySendersByOrganization(
        organizationId
      );
    return senders.map(utils.convertPgSenderToSenderDto);
  }

  async updateSender(
    senderId: string,
    dto: RequestDto.UpdateSenderDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.SenderDto | UpdateSenderErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return UpdateSenderErrors.noActiveOrganization;
    }

    const sender = await this.sendersRepository.getOneSenderById(senderId);
    if (sender === null) return UpdateSenderErrors.inexistingSender;
    if (sender.organization_id !== organizationId) {
      return UpdateSenderErrors.notInMyOrg;
    }

    if (
      (dto.smtpPort !== undefined && !isAllowedSmtpPort(dto.smtpPort)) ||
      (dto.imapPort !== undefined && !isAllowedImapPort(dto.imapPort))
    ) {
      return UpdateSenderErrors.invalidPort;
    }
    if (
      (dto.smtpHost !== undefined && !(await isPublicHost(dto.smtpHost))) ||
      (dto.imapHost !== undefined && !(await isPublicHost(dto.imapHost)))
    ) {
      return UpdateSenderErrors.invalidHost;
    }

    const resetVerification = connectionChanged(dto, sender);
    try {
      const updated = await this.sendersRepository.updateOneSender(
        senderId,
        {
          fromName: dto.fromName ?? sender.from_name,
          fromEmail: dto.fromEmail ?? sender.from_email,
          smtpHost: dto.smtpHost ?? sender.smtp_host,
          smtpPort: dto.smtpPort ?? sender.smtp_port,
          smtpSecure: dto.smtpSecure ?? sender.smtp_secure,
          imapHost: dto.imapHost ?? sender.imap_host,
          imapPort: dto.imapPort ?? sender.imap_port,
          imapSecure: dto.imapSecure ?? sender.imap_secure,
          username: dto.username ?? sender.username,
          secretEncrypted:
            dto.secret === undefined
              ? sender.secret_encrypted
              : encryptSecret(dto.secret),
          dailyCap: dto.dailyCap ?? sender.daily_cap,
          signature: dto.signature ?? sender.signature,
          status: resetVerification ? "unverified" : sender.status,
          lastVerifiedAt: resetVerification ? null : sender.last_verified_at,
        },
        organizationId
      );
      if (updated === null) return UpdateSenderErrors.inexistingSender;
      return utils.convertPgSenderToSenderDto(updated);
    } catch (error) {
      console.error(
        `[senders] updateSender failed senderId=${senderId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return UpdateSenderErrors.updateFailed;
    }
  }

  async deleteSender(
    senderId: string,
    activeOrganizationId: string | null | undefined
  ): Promise<void | DeleteSenderErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return DeleteSenderErrors.noActiveOrganization;
    }

    const sender = await this.sendersRepository.getOneSenderById(senderId);
    if (sender === null) return DeleteSenderErrors.inexistingSender;
    if (sender.organization_id !== organizationId) {
      return DeleteSenderErrors.notInMyOrg;
    }

    try {
      await this.sendersRepository.deleteOneSender(senderId, organizationId);
    } catch (error) {
      console.error(
        `[senders] deleteSender failed senderId=${senderId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return DeleteSenderErrors.deleteFailed;
    }
    return;
  }

  async testSender(
    senderId: string,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.SenderDto | TestSenderErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return TestSenderErrors.noActiveOrganization;
    }

    const sender = await this.sendersRepository.getOneSenderById(senderId);
    if (sender === null) return TestSenderErrors.inexistingSender;
    if (sender.organization_id !== organizationId) {
      return TestSenderErrors.notInMyOrg;
    }

    const result = await verifyMailbox(toMailboxCredentials(sender));

    await this.sendersRepository.updateOneSenderVerification(
      senderId,
      {
        status: result.ok ? "active" : "error",
        lastVerifiedAt: result.ok ? new Date() : sender.last_verified_at,
      },
      organizationId
    );

    if (!result.ok) {
      console.error(
        `[senders] testSender connection failed senderId=${senderId}: ${result.error}`
      );
      return TestSenderErrors.connectionFailed;
    }

    const refreshed = await this.sendersRepository.getOneSenderById(senderId);
    if (refreshed === null) return TestSenderErrors.inexistingSender;
    return utils.convertPgSenderToSenderDto(refreshed);
  }
}

function connectionChanged(
  dto: RequestDto.UpdateSenderDto,
  sender: PgSender
): boolean {
  if (dto.secret !== undefined) return true;
  return (
    (dto.smtpHost !== undefined && dto.smtpHost !== sender.smtp_host) ||
    (dto.smtpPort !== undefined && dto.smtpPort !== sender.smtp_port) ||
    (dto.smtpSecure !== undefined && dto.smtpSecure !== sender.smtp_secure) ||
    (dto.imapHost !== undefined && dto.imapHost !== sender.imap_host) ||
    (dto.imapPort !== undefined && dto.imapPort !== sender.imap_port) ||
    (dto.imapSecure !== undefined && dto.imapSecure !== sender.imap_secure) ||
    (dto.username !== undefined && dto.username !== sender.username)
  );
}

function toMailboxCredentials(sender: PgSender) {
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
