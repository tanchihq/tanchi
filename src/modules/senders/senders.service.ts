import { decryptSecret, encryptSecret } from "@shared/crypto";
import { verifyMailbox } from "@shared/mailbox";
import type { SendersRepository } from "./repository/senders/senders.repository.ts";
import type { PgSender } from "./repository/senders/senders.entities.ts";
import {
  CreateSenderErrors,
  DeleteSenderErrors,
  ListSendersErrors,
  TestSenderErrors,
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
      await this.sendersRepository.deleteOneSender(senderId);
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

    await this.sendersRepository.updateOneSenderVerification(senderId, {
      status: result.ok ? "active" : "error",
      lastVerifiedAt: result.ok ? new Date() : sender.last_verified_at,
    });

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
