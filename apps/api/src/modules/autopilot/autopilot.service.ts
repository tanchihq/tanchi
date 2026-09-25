import { recordActivity } from "@shared/activity";
import { getBillingAccess } from "@shared/billing";
import { decryptSecret } from "@shared/crypto";
import { sendEmail, type MailboxCredentials } from "@shared/mailbox";
import type { AutopilotRepository } from "./repository/autopilot/autopilot.repository.ts";
import type {
  PgAutopilotCandidate,
  PgAutopilotSender,
} from "./repository/autopilot/autopilot.entities.ts";
import {
  GetAutopilotErrors,
  UpdateAutopilotErrors,
} from "./autopilot.errors.ts";
import {
  BOUNCE_RATE_WINDOW_DAYS,
  CANDIDATE_BATCH_LIMIT,
} from "./autopilot.constants.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./autopilot.utils.ts";

function toCredentials(sender: PgAutopilotSender): MailboxCredentials {
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

function appendSignature(body: string, signature: string): string {
  return signature === "" ? body : `${body}\n\n${signature}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class AutopilotService {
  constructor(private readonly autopilotRepository: AutopilotRepository) {}

  async getAutopilot(
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.AutopilotDto | GetAutopilotErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetAutopilotErrors.noActiveOrganization;
    }
    return this.readStatus(organizationId);
  }

  async updateAutopilot(
    dto: RequestDto.UpdateAutopilotDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.AutopilotDto | UpdateAutopilotErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return UpdateAutopilotErrors.noActiveOrganization;
    }

    try {
      const updated = await this.autopilotRepository.updateEnabled(
        organizationId,
        dto.enabled
      );
      if (!updated) return UpdateAutopilotErrors.notOnboarded;
    } catch (error) {
      console.error(
        `[autopilot] updateAutopilot failed orgId=${organizationId}: ${errorMessage(error)}`
      );
      return UpdateAutopilotErrors.updateFailed;
    }

    return this.readStatus(organizationId);
  }

  async runAllOrganizations(now: Date = new Date()): Promise<number> {
    const organizationIds =
      await this.autopilotRepository.getEnabledOrganizationIds();
    let sent = 0;
    for (const organizationId of organizationIds) {
      try {
        sent += await this.runOrganization(organizationId, now);
      } catch (error) {
        console.error(
          `[autopilot] run failed orgId=${organizationId}: ${errorMessage(error)}`
        );
      }
    }
    return sent;
  }

  async runOrganization(
    organizationId: string,
    now: Date = new Date()
  ): Promise<number> {
    const settings = await this.autopilotRepository.getSettings(organizationId);
    if (settings === null || !settings.autopilot_enabled) return 0;

    const access = await getBillingAccess(organizationId);
    if (access.state === "expired") return 0;

    const senders = await this.autopilotRepository.getSenderStats(
      organizationId,
      BOUNCE_RATE_WINDOW_DAYS
    );
    const available = senders.filter((sender) => utils.canSendNow(sender, now));
    if (available.length === 0) return 0;

    const candidates = (
      await this.autopilotRepository.getCandidates(
        organizationId,
        CANDIDATE_BATCH_LIMIT
      )
    ).filter((candidate) =>
      utils.isWithinSendWindow(
        now,
        utils.marketTimezone(candidate.country),
        candidate.excluded_weekdays
      )
    );
    const assignments = utils.assignSenders(
      candidates,
      available,
      new Set(senders.map((sender) => sender.id))
    );

    let sent = 0;
    for (const assignment of assignments) {
      if (await this.send(organizationId, assignment)) sent += 1;
    }
    return sent;
  }

  private async send(
    organizationId: string,
    { candidate, sender }: utils.SendAssignment
  ): Promise<boolean> {
    const claimed = await this.autopilotRepository.claimDraft(
      organizationId,
      candidate.message_id
    );
    if (!claimed) return false;

    const thread = await this.autopilotRepository.getThreadMessageIds(
      organizationId,
      candidate.lead_id
    );
    const emailMessageId = await this.deliver(sender, candidate, thread);
    if (emailMessageId === null) {
      await this.autopilotRepository.releaseDraft(
        organizationId,
        candidate.message_id
      );
      return false;
    }

    await this.autopilotRepository.markSentAutomatically({
      organizationId,
      messageId: candidate.message_id,
      leadId: candidate.lead_id,
      senderId: sender.id,
      emailMessageId,
    });
    await recordActivity({
      organizationId,
      type: "sent",
      title: `Email sent automatically to ${candidate.email}`,
      leadId: candidate.lead_id,
    });
    return true;
  }

  private async deliver(
    sender: PgAutopilotSender,
    candidate: PgAutopilotCandidate,
    thread: ReadonlyArray<string>
  ): Promise<string | null> {
    try {
      const delivered = await sendEmail(toCredentials(sender), {
        fromName: sender.from_name,
        fromEmail: sender.from_email,
        to: candidate.email,
        subject: candidate.subject ?? "",
        text: appendSignature(candidate.body, sender.signature),
        inReplyTo: thread.at(-1) ?? null,
        references: thread,
      });
      return delivered.messageId;
    } catch (error) {
      console.error(
        `[autopilot] send failed leadId=${candidate.lead_id}: ${errorMessage(error)}`
      );
      return null;
    }
  }

  private async readStatus(
    organizationId: string
  ): Promise<ResponseDto.AutopilotDto> {
    const [settings, icpsWithoutPlaybook, senders, queuedEmails] =
      await Promise.all([
        this.autopilotRepository.getSettings(organizationId),
        this.autopilotRepository.getIcpNamesWithoutPlaybook(organizationId),
        this.autopilotRepository.getSenderStats(
          organizationId,
          BOUNCE_RATE_WINDOW_DAYS
        ),
        this.autopilotRepository.countEligibleDrafts(organizationId),
      ]);
    return utils.convertToAutopilotDto(
      settings,
      icpsWithoutPlaybook,
      senders,
      queuedEmails
    );
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
