import { recordActivity } from "@shared/activity";
import { decryptSecret } from "@shared/crypto";
import { sendEmail, type MailboxCredentials } from "@shared/mailbox";
import type { ProspectsRepository } from "./repository/prospects/prospects.repository.ts";
import type {
  PgDraftMessage,
  PgLeadRow,
  PgProspectAngle,
  PgProspectFact,
  PgSenderCred,
  PgStage,
} from "./repository/prospects/prospects.entities.ts";
import {
  CHANNEL_LABELS,
  FIRST_TOUCH_SEQUENCE_STEP,
} from "./prospects.constants.ts";
import {
  ContactProspectErrors,
  DeleteProspectErrors,
  GetProspectErrors,
  GetProspectsErrors,
  UpdateStageErrors,
  ValidateProspectErrors,
} from "./prospects.errors.ts";
import type * as RequestDto from "./dto/request/index.ts";
import type * as ResponseDto from "./dto/response/index.ts";
import * as utils from "./prospects.utils.ts";

type SendResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: "noDraft" | "noSender" | "sendFailed" }>;

type DeliveryResult =
  | Readonly<{ ok: true; senderId: string | null }>
  | Readonly<{ ok: false; reason: "noSender" | "sendFailed" }>;

function toCredentials(sender: PgSenderCred): MailboxCredentials {
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

const KEPT_STAGES_AFTER_SEND: ReadonlyArray<PgStage> = [
  "replied",
  "meeting",
  "won",
];

function stageAfterSend(lead: PgLeadRow): PgStage {
  if (KEPT_STAGES_AFTER_SEND.includes(lead.stage)) return lead.stage;
  return lead.sequence_step === FIRST_TOUCH_SEQUENCE_STEP
    ? "contacted"
    : "following-up";
}

export class ProspectsService {
  constructor(private readonly prospectsRepository: ProspectsRepository) {}

  async getProspects(
    activeOrganizationId: string | null | undefined
  ): Promise<ReadonlyArray<ResponseDto.ProspectDto> | GetProspectsErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetProspectsErrors.noActiveOrganization;
    }
    const leads =
      await this.prospectsRepository.getManyLeadsByOrganization(
        organizationId
      );
    return leads.map(utils.convertPgLeadListRowToProspectDto);
  }

  async getProspect(
    id: string,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.LeadDetailDto | GetProspectErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return GetProspectErrors.noActiveOrganization;
    }

    const lead = await this.prospectsRepository.getOneLeadById(id);
    if (lead === null) return GetProspectErrors.inexistingProspect;
    if (lead.organization_id !== organizationId) {
      return GetProspectErrors.notInMyOrg;
    }

    return this.assembleDetail(lead);
  }

  async updateStage(
    id: string,
    dto: RequestDto.UpdateStageDto,
    activeOrganizationId: string | null | undefined
  ): Promise<ResponseDto.ProspectDto | UpdateStageErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return UpdateStageErrors.noActiveOrganization;
    }

    const lead = await this.prospectsRepository.getOneLeadById(id);
    if (lead === null) return UpdateStageErrors.inexistingProspect;
    if (lead.organization_id !== organizationId) {
      return UpdateStageErrors.notInMyOrg;
    }

    try {
      await this.prospectsRepository.updateOneLeadStage(
        id,
        dto.stage,
        dto.origin,
        organizationId
      );
    } catch (error) {
      console.error(
        `[prospects] updateStage failed leadId=${id}: ${errorMessage(error)}`
      );
      return UpdateStageErrors.updateFailed;
    }

    const refreshed = await this.prospectsRepository.getOneLeadById(id);
    if (refreshed === null) return UpdateStageErrors.inexistingProspect;
    return utils.convertPgLeadRowToProspectDto(refreshed);
  }

  async deleteProspect(
    id: string,
    dto: RequestDto.DeleteProspectDto,
    activeOrganizationId: string | null | undefined
  ): Promise<void | DeleteProspectErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return DeleteProspectErrors.noActiveOrganization;
    }

    const lead = await this.prospectsRepository.getOneLeadById(id);
    if (lead === null) return DeleteProspectErrors.inexistingProspect;
    if (lead.organization_id !== organizationId) {
      return DeleteProspectErrors.notInMyOrg;
    }

    try {
      await this.prospectsRepository.excludeProspect({
        organizationId,
        leadId: lead.id,
        companyId: lead.company_id,
        scope: dto.scope,
        email: lead.email,
        companyDomain: lead.company_domain,
        reason: dto.reason ?? null,
      });
    } catch (error) {
      console.error(
        `[prospects] deleteProspect failed leadId=${id}: ${errorMessage(error)}`
      );
      return DeleteProspectErrors.deleteFailed;
    }
    return;
  }

  async contactProspect(
    id: string,
    activeOrganizationId: string | null | undefined,
    senderId: string | undefined
  ): Promise<ResponseDto.LeadDetailDto | ContactProspectErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return ContactProspectErrors.noActiveOrganization;
    }

    const lead = await this.prospectsRepository.getOneLeadById(id);
    if (lead === null) return ContactProspectErrors.inexistingProspect;
    if (lead.organization_id !== organizationId) {
      return ContactProspectErrors.notInMyOrg;
    }

    const send = await this.sendDraft(lead, organizationId, senderId);
    if (!send.ok) return contactReason(send.reason);

    await this.prospectsRepository.updateOneLeadStage(
      id,
      "contacted",
      "manual",
      organizationId
    );
    const refreshed = await this.prospectsRepository.getOneLeadById(id);
    if (refreshed === null) return ContactProspectErrors.inexistingProspect;
    return this.assembleDetail(refreshed);
  }

  async validateProspect(
    id: string,
    activeOrganizationId: string | null | undefined,
    senderId: string | undefined
  ): Promise<ResponseDto.LeadDetailDto | ValidateProspectErrors> {
    const organizationId = resolveActiveOrganization(activeOrganizationId);
    if (organizationId === null) {
      return ValidateProspectErrors.noActiveOrganization;
    }

    const lead = await this.prospectsRepository.getOneLeadById(id);
    if (lead === null) return ValidateProspectErrors.inexistingProspect;
    if (lead.organization_id !== organizationId) {
      return ValidateProspectErrors.notInMyOrg;
    }

    const send = await this.sendDraft(lead, organizationId, senderId);
    if (!send.ok) return validateReason(send.reason);

    await this.prospectsRepository.updateOneLeadStage(
      id,
      stageAfterSend(lead),
      "manual",
      organizationId
    );
    const refreshed = await this.prospectsRepository.getOneLeadById(id);
    if (refreshed === null) return ValidateProspectErrors.inexistingProspect;
    return this.assembleDetail(refreshed);
  }

  private async sendDraft(
    lead: PgLeadRow,
    organizationId: string,
    senderId: string | undefined
  ): Promise<SendResult> {
    const draft = await this.prospectsRepository.getLatestDraftMessageByLead(
      lead.id
    );
    if (draft === null) return { ok: false, reason: "noDraft" };

    const delivery = await this.deliver(lead, draft, organizationId, senderId);
    if (!delivery.ok) return { ok: false, reason: delivery.reason };

    await this.prospectsRepository.markMessageSentAndRecord({
      messageId: draft.id,
      senderId: delivery.senderId,
      organizationId,
      leadId: lead.id,
    });
    await recordActivity({
      organizationId,
      type: "sent",
      title: sentActivityTitle(lead),
      leadId: lead.id,
    });
    return { ok: true };
  }

  private async deliver(
    lead: PgLeadRow,
    draft: PgDraftMessage,
    organizationId: string,
    senderId: string | undefined
  ): Promise<DeliveryResult> {
    if (lead.channel !== "email" || lead.email === null) {
      return { ok: true, senderId: null };
    }

    const sender =
      senderId === undefined
        ? await this.prospectsRepository.getFirstActiveSenderByOrganization(
            organizationId
          )
        : await this.prospectsRepository.getActiveSenderById(
            organizationId,
            senderId
          );
    if (sender === null) return { ok: false, reason: "noSender" };

    try {
      await sendEmail(toCredentials(sender), {
        fromName: sender.from_name,
        fromEmail: sender.from_email,
        to: lead.email,
        subject: draft.subject ?? "",
        text: appendSignature(draft.body, sender.signature),
      });
    } catch (error) {
      console.error(
        `[prospects] deliver failed leadId=${lead.id}: ${errorMessage(error)}`
      );
      return { ok: false, reason: "sendFailed" };
    }

    return { ok: true, senderId: sender.id };
  }

  private async assembleDetail(
    lead: PgLeadRow
  ): Promise<ResponseDto.LeadDetailDto> {
    const [dossier, messages, outcomes] = await Promise.all([
      this.prospectsRepository.getDossierByLead(lead.id),
      this.prospectsRepository.getMessagesByLead(lead.id),
      this.prospectsRepository.getOutcomesByLead(lead.id),
    ]);

    const [facts, angles]: readonly [
      ReadonlyArray<PgProspectFact>,
      ReadonlyArray<PgProspectAngle>,
    ] =
      dossier === null
        ? [[], []]
        : await Promise.all([
            this.prospectsRepository.getFactsByDossier(dossier.id),
            this.prospectsRepository.getAnglesByDossier(dossier.id),
          ]);

    return utils.convertToLeadDetailDto(
      lead,
      facts,
      angles,
      messages,
      outcomes
    );
  }
}

function contactReason(
  reason: "noDraft" | "noSender" | "sendFailed"
): ContactProspectErrors {
  switch (reason) {
    case "noDraft":
      return ContactProspectErrors.noDraft;
    case "noSender":
      return ContactProspectErrors.noSender;
    case "sendFailed":
      return ContactProspectErrors.sendFailed;
  }
}

function validateReason(
  reason: "noDraft" | "noSender" | "sendFailed"
): ValidateProspectErrors {
  switch (reason) {
    case "noDraft":
      return ValidateProspectErrors.noDraft;
    case "noSender":
      return ValidateProspectErrors.noSender;
    case "sendFailed":
      return ValidateProspectErrors.sendFailed;
  }
}

function sentActivityTitle(lead: PgLeadRow): string {
  if (lead.channel === "email" && lead.email !== null) {
    return `Email sent to ${lead.email}`;
  }
  const label = CHANNEL_LABELS[lead.channel] ?? lead.channel;
  return `${label} message marked as sent`;
}

function appendSignature(body: string, signature: string): string {
  return signature === "" ? body : `${body}\n\n${signature}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
