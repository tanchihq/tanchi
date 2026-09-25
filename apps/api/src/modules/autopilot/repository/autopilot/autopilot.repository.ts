import type { AutopilotPostgres } from "./autopilot.postgres.ts";
import type {
  MarkSentAutomaticallyInput,
  PgAutopilotCandidate,
  PgAutopilotSender,
  PgAutopilotSettings,
} from "./autopilot.entities.ts";

export class AutopilotRepository {
  constructor(private readonly autopilotPostgres: AutopilotPostgres) {}

  getSettings(organizationId: string): Promise<PgAutopilotSettings | null> {
    return this.autopilotPostgres.getSettings(organizationId);
  }

  updateEnabled(organizationId: string, enabled: boolean): Promise<boolean> {
    return this.autopilotPostgres.updateEnabled(organizationId, enabled);
  }

  getEnabledOrganizationIds(): Promise<ReadonlyArray<string>> {
    return this.autopilotPostgres.getEnabledOrganizationIds();
  }

  getIcpNamesWithoutPlaybook(
    organizationId: string
  ): Promise<ReadonlyArray<string>> {
    return this.autopilotPostgres.getIcpNamesWithoutPlaybook(organizationId);
  }

  getSenderStats(
    organizationId: string,
    bounceWindowDays: number
  ): Promise<ReadonlyArray<PgAutopilotSender>> {
    return this.autopilotPostgres.getSenderStats(
      organizationId,
      bounceWindowDays
    );
  }

  countEligibleDrafts(organizationId: string): Promise<number> {
    return this.autopilotPostgres.countEligibleDrafts(organizationId);
  }

  getCandidates(
    organizationId: string,
    limit: number
  ): Promise<ReadonlyArray<PgAutopilotCandidate>> {
    return this.autopilotPostgres.getCandidates(organizationId, limit);
  }

  getThreadMessageIds(
    organizationId: string,
    leadId: string
  ): Promise<ReadonlyArray<string>> {
    return this.autopilotPostgres.getThreadMessageIds(organizationId, leadId);
  }

  claimDraft(organizationId: string, messageId: string): Promise<boolean> {
    return this.autopilotPostgres.claimDraft(organizationId, messageId);
  }

  releaseDraft(organizationId: string, messageId: string): Promise<void> {
    return this.autopilotPostgres.releaseDraft(organizationId, messageId);
  }

  markSentAutomatically(input: MarkSentAutomaticallyInput): Promise<void> {
    return this.autopilotPostgres.markSentAutomatically(input);
  }
}
