import { recordActivity } from "@shared/activity";
import { decryptSecret } from "@shared/crypto";
import {
  fetchRecentReplies,
  type MailboxCredentials,
  type MailboxReply,
} from "@shared/mailbox";
import type { LlmProvider } from "@shared/llm";
import type { RewardRepository } from "./repository/reward/reward.repository.ts";
import type { PgRewardSender } from "./repository/reward/reward.entities.ts";
import {
  CLASSIFY_MAX_TOKENS,
  REPLY_POLL_SINCE_MINUTES,
} from "./reward.constants.ts";
import { buildClassifyPrompt } from "./reward.prompt.ts";

type Classification = "positive" | "negative" | "later" | "neutral";

const MINUTE_MS = 60 * 1000;

const STAGE_BY_CLASSIFICATION: Readonly<Record<Classification, string>> = {
  positive: "meeting",
  negative: "not-interested",
  later: "snoozed",
  neutral: "replied",
};

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

  private async pollSender(
    sender: PgRewardSender,
    since: Date
  ): Promise<number> {
    const replies = await this.tryFetch(sender, since);
    let processed = 0;
    for (const reply of replies) {
      if (await this.processReply(sender.organization_id, reply)) {
        processed += 1;
      }
    }
    return processed;
  }

  private async tryFetch(
    sender: PgRewardSender,
    since: Date
  ): Promise<ReadonlyArray<MailboxReply>> {
    try {
      return await fetchRecentReplies(toCredentials(sender), since);
    } catch (error) {
      console.error(
        `[reward] fetchReplies failed senderId=${sender.id}: ${errorMessage(error)}`
      );
      return [];
    }
  }

  private async processReply(
    organizationId: string,
    reply: MailboxReply
  ): Promise<boolean> {
    const lead = await this.rewardRepository.getLeadByEmail(
      organizationId,
      reply.fromEmail
    );
    if (lead === null) return false;
    if (await this.rewardRepository.hasRepliedOutcome(lead.id)) return false;

    const messageId = await this.rewardRepository.getLatestSentMessageId(
      lead.id
    );
    if (messageId === null) return false;

    const classification = await this.classify(reply.text);
    await this.rewardRepository.recordReply({
      organizationId,
      leadId: lead.id,
      messageId,
      classification,
      replyText: reply.text,
      stage: STAGE_BY_CLASSIFICATION[classification],
    });
    await recordActivity({
      organizationId,
      type: "reply",
      title: `${classification} reply from ${reply.fromEmail}`,
      leadId: lead.id,
    });
    return true;
  }

  private async classify(text: string): Promise<Classification> {
    try {
      const raw = await this.llm.generate({
        prompt: buildClassifyPrompt(text),
        maxTokens: CLASSIFY_MAX_TOKENS,
      });
      const word = raw.trim().toLowerCase();
      if (word.includes("positive")) return "positive";
      if (word.includes("negative")) return "negative";
      if (word.includes("later")) return "later";
      return "neutral";
    } catch {
      return "neutral";
    }
  }
}
