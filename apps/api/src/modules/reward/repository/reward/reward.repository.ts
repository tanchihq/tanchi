import type { RewardPostgres } from "./reward.postgres.ts";
import type {
  AdoptReplierInput,
  MarkLeadBouncedInput,
  PgRewardLead,
  PgRewardSender,
  PgRewardSentSubject,
  PgRewardThreadMatch,
  RecordReplyInput,
} from "./reward.entities.ts";

export class RewardRepository {
  constructor(private readonly rewardPostgres: RewardPostgres) {}

  getAllActiveSenders(): Promise<ReadonlyArray<PgRewardSender>> {
    return this.rewardPostgres.getAllActiveSenders();
  }

  getSenderAddresses(organizationId: string): Promise<ReadonlyArray<string>> {
    return this.rewardPostgres.getSenderAddresses(organizationId);
  }

  getLeadById(
    organizationId: string,
    leadId: string
  ): Promise<PgRewardLead | null> {
    return this.rewardPostgres.getLeadById(organizationId, leadId);
  }

  getLeadByEmail(
    organizationId: string,
    email: string
  ): Promise<PgRewardLead | null> {
    return this.rewardPostgres.getLeadByEmail(organizationId, email);
  }

  getLeadsByEmailDomain(
    organizationId: string,
    domain: string
  ): Promise<ReadonlyArray<PgRewardLead>> {
    return this.rewardPostgres.getLeadsByEmailDomain(organizationId, domain);
  }

  getSentMessagesByEmailMessageIds(
    organizationId: string,
    emailMessageIds: ReadonlyArray<string>
  ): Promise<ReadonlyArray<PgRewardThreadMatch>> {
    return this.rewardPostgres.getSentMessagesByEmailMessageIds(
      organizationId,
      emailMessageIds
    );
  }

  getRecentSentSubjects(
    organizationId: string,
    sinceDays: number
  ): Promise<ReadonlyArray<PgRewardSentSubject>> {
    return this.rewardPostgres.getRecentSentSubjects(organizationId, sinceDays);
  }

  hasProcessedReply(
    organizationId: string,
    replyMessageId: string
  ): Promise<boolean> {
    return this.rewardPostgres.hasProcessedReply(organizationId, replyMessageId);
  }

  getLatestSentMessageId(
    organizationId: string,
    leadId: string
  ): Promise<string | null> {
    return this.rewardPostgres.getLatestSentMessageId(organizationId, leadId);
  }

  recordReply(input: RecordReplyInput): Promise<boolean> {
    return this.rewardPostgres.recordReply(input);
  }

  adoptReplier(input: AdoptReplierInput): Promise<void> {
    return this.rewardPostgres.adoptReplier(input);
  }

  getBounceCandidate(
    organizationId: string,
    recipient: string,
    originalMessageId: string | null
  ): Promise<PgRewardLead | null> {
    if (originalMessageId === null) {
      return this.rewardPostgres.getBounceCandidateByEmail(
        organizationId,
        recipient
      );
    }
    return this.rewardPostgres
      .getBounceCandidateByThread(organizationId, recipient, originalMessageId)
      .then(
        (lead) =>
          lead ??
          this.rewardPostgres.getBounceCandidateByEmail(organizationId, recipient)
      );
  }

  markLeadBounced(input: MarkLeadBouncedInput): Promise<void> {
    return this.rewardPostgres.markLeadBounced(input);
  }
}
