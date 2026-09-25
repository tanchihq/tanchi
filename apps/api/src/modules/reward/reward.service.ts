import { recordActivity } from "@shared/activity";
import { decryptSecret } from "@shared/crypto";
import { ARRAY, todayLabel } from "@shared/utils";
import {
  fetchRecentReplies,
  type InboundEmail,
  type MailboxCredentials,
} from "@shared/mailbox";
import {
  hasReplyPrefix,
  normalizeSubject,
  type BounceReport,
} from "@shared/mail-parse";
import type { LlmProvider } from "@shared/llm";
import { agentModel } from "@shared/llm";
import type { RewardRepository } from "./repository/reward/reward.repository.ts";
import type {
  PgRewardLead,
  PgRewardSender,
  PgRewardSentSubject,
} from "./repository/reward/reward.entities.ts";
import {
  AUTOMATED_LOCAL_PARTS,
  BOUNCE_EXCLUSION_REASON,
  BOUNCE_PROTECTED_STAGES,
  CLASSIFY_MAX_TOKENS,
  PUBLIC_EMAIL_DOMAINS,
  REPLY_POLL_SINCE_MINUTES,
  SUBJECT_MATCH_WINDOW_DAYS,
} from "./reward.constants.ts";
import { buildClassifyPrompt } from "./reward.prompt.ts";
import {
  formatReplyFrom,
  nextStageAfterReply,
  replyKeyOf,
  shouldAdoptReplier,
  splitDisplayName,
  type Classification,
} from "./reward.utils.ts";

const MINUTE_MS = 60 * 1000;

const PUBLIC_DOMAIN_SET: ReadonlySet<string> = new Set(PUBLIC_EMAIL_DOMAINS);

const AUTOMATED_LOCAL_SET: ReadonlySet<string> = new Set(AUTOMATED_LOCAL_PARTS);

export type InboundContext = Readonly<{
  organizationId: string;
  ownAddresses: ReadonlySet<string>;
  sentSubjects: ReadonlyArray<PgRewardSentSubject>;
}>;

type LeadMatch = Readonly<{
  lead: PgRewardLead;
  messageId: string;
}>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toCredentials(sender: PgRewardSender): MailboxCredentials {
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

export class RewardService {
  constructor(
    private readonly rewardRepository: RewardRepository,
    private readonly llm: LlmProvider
  ) {}

  async pollReplies(): Promise<number> {
    const senders = await this.rewardRepository.getAllActiveSenders();
    const since = new Date(Date.now() - REPLY_POLL_SINCE_MINUTES * MINUTE_MS);
    let processed = 0;
    for (const sender of senders) {
      processed += await this.pollSender(sender, since);
    }
    return processed;
  }

  async buildContext(organizationId: string): Promise<InboundContext> {
    const [ownAddresses, sentSubjects] = await Promise.all([
      this.rewardRepository.getSenderAddresses(organizationId),
      this.rewardRepository.getRecentSentSubjects(
        organizationId,
        SUBJECT_MATCH_WINDOW_DAYS
      ),
    ]);
    return {
      organizationId,
      ownAddresses: new Set(ownAddresses),
      sentSubjects,
    };
  }

  async processInbound(
    context: InboundContext,
    email: InboundEmail
  ): Promise<boolean> {
    if (context.ownAddresses.has(email.fromEmail)) return false;
    if (email.bounce !== null) return this.processBounce(context, email.bounce);
    if (email.isAutoReply) return false;

    const replyMessageId = replyKeyOf(email);
    if (
      await this.rewardRepository.hasProcessedReply(
        context.organizationId,
        replyMessageId
      )
    ) {
      return false;
    }

    const match = await this.findLead(context, email);
    if (match === null) return false;

    const classification = await this.classify(
      email.text.trim() === "" ? email.subject : email.text
    );
    const recorded = await this.rewardRepository.recordReply({
      organizationId: context.organizationId,
      leadId: match.lead.id,
      messageId: match.messageId,
      classification,
      replyText: email.text,
      replyMessageId,
      replyFrom: formatReplyFrom(email),
      stage: nextStageAfterReply(match.lead.stage, classification),
    });
    if (!recorded) return false;

    if (shouldAdoptReplier(match.lead, email.fromEmail)) {
      const names = splitDisplayName(email.fromName);
      await this.rewardRepository.adoptReplier({
        organizationId: context.organizationId,
        leadId: match.lead.id,
        email: email.fromEmail,
        firstName: names.firstName,
        lastName: names.lastName,
      });
    }

    await recordActivity({
      organizationId: context.organizationId,
      type: "reply",
      title: `${classification} reply from ${email.fromEmail}`,
      leadId: match.lead.id,
    });
    return true;
  }

  private async pollSender(
    sender: PgRewardSender,
    since: Date
  ): Promise<number> {
    const [inbound, context] = await Promise.all([
      this.tryFetch(sender, since),
      this.buildContext(sender.organization_id),
    ]);
    let processed = 0;
    for (const email of inbound) {
      try {
        if (await this.processInbound(context, email)) processed += 1;
      } catch (error) {
        console.error(
          `[reward] processInbound failed senderId=${sender.id} from=${email.fromEmail}: ${errorMessage(error)}`
        );
      }
    }
    return processed;
  }

  private async tryFetch(
    sender: PgRewardSender,
    since: Date
  ): Promise<ReadonlyArray<InboundEmail>> {
    try {
      return await fetchRecentReplies(toCredentials(sender), since);
    } catch (error) {
      console.error(
        `[reward] fetchReplies failed senderId=${sender.id}: ${errorMessage(error)}`
      );
      return [];
    }
  }

  private async processBounce(
    context: InboundContext,
    bounce: BounceReport
  ): Promise<boolean> {
    const recipients = bounce.permanentFailures.filter(
      (address) => !context.ownAddresses.has(address)
    );
    let marked = 0;
    for (const recipient of recipients) {
      const lead = await this.rewardRepository.getBounceCandidate(
        context.organizationId,
        recipient,
        bounce.originalMessageId
      );
      if (lead === null || BOUNCE_PROTECTED_STAGES.includes(lead.stage)) {
        continue;
      }
      await this.rewardRepository.markLeadBounced({
        organizationId: context.organizationId,
        leadId: lead.id,
        email: recipient,
        reason: BOUNCE_EXCLUSION_REASON,
      });
      await recordActivity({
        organizationId: context.organizationId,
        type: "bounced",
        title: `Email to ${recipient} bounced — the address does not exist`,
        leadId: lead.id,
      });
      marked += 1;
    }
    return marked > 0;
  }

  private async findLead(
    context: InboundContext,
    email: InboundEmail
  ): Promise<LeadMatch | null> {
    const byThread = await this.findByThread(
      context.organizationId,
      email.referencedMessageIds
    );
    if (byThread !== null) return byThread;

    const byAddress = await this.findByAddress(
      context.organizationId,
      email.fromEmail
    );
    if (byAddress !== null) {
      return this.withLatestSentMessage(context.organizationId, byAddress);
    }

    return this.findBySubject(context, email.subject);
  }

  private async findByThread(
    organizationId: string,
    referencedMessageIds: ReadonlyArray<string>
  ): Promise<LeadMatch | null> {
    const matches =
      await this.rewardRepository.getSentMessagesByEmailMessageIds(
        organizationId,
        referencedMessageIds
      );
    const match = matches[ARRAY.FIRST_INDEX];
    if (match === undefined) return null;
    const lead = await this.rewardRepository.getLeadById(
      organizationId,
      match.lead_id
    );
    return lead === null ? null : { lead, messageId: match.message_id };
  }

  private async findByAddress(
    organizationId: string,
    fromEmail: string
  ): Promise<PgRewardLead | null> {
    const exact = await this.rewardRepository.getLeadByEmail(
      organizationId,
      fromEmail
    );
    if (exact !== null) return exact;

    const [localPart, domain = ""] = fromEmail.split("@");
    if (domain === "" || PUBLIC_DOMAIN_SET.has(domain)) return null;
    if (localPart !== undefined && AUTOMATED_LOCAL_SET.has(localPart)) {
      return null;
    }

    const domainLeads = await this.rewardRepository.getLeadsByEmailDomain(
      organizationId,
      domain
    );
    const distinctEmails = new Set(domainLeads.map((lead) => lead.email));
    if (distinctEmails.size !== 1) return null;
    return domainLeads[ARRAY.FIRST_INDEX] ?? null;
  }

  private async findBySubject(
    context: InboundContext,
    subject: string
  ): Promise<LeadMatch | null> {
    if (!hasReplyPrefix(subject)) return null;
    const normalized = normalizeSubject(subject);
    if (normalized === "") return null;

    const matches = context.sentSubjects.filter(
      (sent) => normalizeSubject(sent.subject) === normalized
    );
    const leadIds = new Set(matches.map((sent) => sent.lead_id));
    const match = matches[ARRAY.FIRST_INDEX];
    if (leadIds.size !== 1 || match === undefined) return null;

    const lead = await this.rewardRepository.getLeadById(
      context.organizationId,
      match.lead_id
    );
    return lead === null ? null : { lead, messageId: match.message_id };
  }

  private async withLatestSentMessage(
    organizationId: string,
    lead: PgRewardLead
  ): Promise<LeadMatch | null> {
    const messageId = await this.rewardRepository.getLatestSentMessageId(
      organizationId,
      lead.id
    );
    return messageId === null ? null : { lead, messageId };
  }

  private async classify(text: string): Promise<Classification> {
    try {
      const raw = await this.llm.generate({
        prompt: buildClassifyPrompt(text, todayLabel()),
        maxTokens: CLASSIFY_MAX_TOKENS,
        model: agentModel("reward"),
      });
      const word =
        raw.trim().toLowerCase().match(/[a-z]+/)?.[ARRAY.FIRST_INDEX] ?? "";
      if (word === "positive") return "positive";
      if (word === "negative") return "negative";
      if (word === "later") return "later";
      return "neutral";
    } catch {
      return "neutral";
    }
  }
}
