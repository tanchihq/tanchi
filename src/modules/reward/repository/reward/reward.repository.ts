import type { RewardPostgres } from "./reward.postgres.ts";
import type {
  PgRewardLead,
  PgRewardSender,
  RecordReplyInput,
} from "./reward.entities.ts";

export class RewardRepository {
  constructor(private readonly rewardPostgres: RewardPostgres) {}

  getAllActiveSenders(): Promise<ReadonlyArray<PgRewardSender>> {
    return this.rewardPostgres.getAllActiveSenders();
  }

  getLeadByEmail(
    organizationId: string,
    email: string
  ): Promise<PgRewardLead | null> {
    return this.rewardPostgres.getLeadByEmail(organizationId, email);
  }

  hasRepliedOutcome(leadId: string): Promise<boolean> {
    return this.rewardPostgres.hasRepliedOutcome(leadId);
  }

  getLatestSentMessageId(leadId: string): Promise<string | null> {
    return this.rewardPostgres.getLatestSentMessageId(leadId);
  }

  recordReply(input: RecordReplyInput): Promise<void> {
    return this.rewardPostgres.recordReply(input);
  }
}
