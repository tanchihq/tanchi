import { recordActivity } from "@shared/activity";
import type { LlmProvider } from "@shared/llm";
import type { SequencesRepository } from "./repository/sequences/sequences.repository.ts";
import type {
  PgDueLead,
  PgSequenceConfig,
  PgSequenceFact,
} from "./repository/sequences/sequences.entities.ts";
import { addBusinessDays, extractJson, lengthBucket } from "./sequences.utils.ts";
import { buildFollowUpPrompt } from "./follow-up.prompt.ts";
import type { FollowUpOutput } from "./follow-up.schema.ts";
import { FollowUpOutputSchema } from "./follow-up.schema.ts";
import {
  DEFAULT_FOLLOW_UP_INTERVALS,
  FOLLOW_UP_MAX_TOKENS,
  FOLLOW_UP_TEMPERATURE,
} from "./sequences.constants.ts";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fullName(lead: PgDueLead): string {
  return [lead.first_name, lead.last_name]
    .filter((part) => part !== null && part !== "")
    .join(" ");
}

function leadLabel(lead: PgDueLead): string {
  const who = fullName(lead) === "" ? "prospect" : fullName(lead);
  return lead.company_name === null ? who : `${who} (${lead.company_name})`;
}

export class SequencesService {
  constructor(
    private readonly sequencesRepository: SequencesRepository,
    private readonly llm: LlmProvider
  ) {}

  async processAllOrganizations(): Promise<void> {
    const organizationIds =
      await this.sequencesRepository.getAllOrganizationIds();
    for (const organizationId of organizationIds) {
      await this.processOrganization(organizationId);
    }
  }

  async processOrganization(organizationId: string): Promise<void> {
    const config =
      await this.sequencesRepository.getSequenceConfig(organizationId);
    if (config === null) return;

    const intervals =
      config.follow_up_intervals.length > 0
        ? config.follow_up_intervals
        : DEFAULT_FOLLOW_UP_INTERVALS;
    const excluded = config.excluded_weekdays;
    const now = new Date();

    const dueLeads = await this.sequencesRepository.getDueLeads(organizationId);
    for (const lead of dueLeads) {
      await this.processLead(lead, config, intervals, excluded, now);
    }
  }

  private async processLead(
    lead: PgDueLead,
    config: PgSequenceConfig,
    intervals: ReadonlyArray<number>,
    excluded: ReadonlyArray<number>,
    now: Date
  ): Promise<void> {
    if (lead.last_sent_at === null) return;

    const gapIndex = Math.min(lead.sequence_step - 1, intervals.length - 1);
    const gap = intervals[gapIndex];
    if (gap === undefined) return;

    const dueAt = addBusinessDays(lead.last_sent_at, gap, excluded);
    if (now < dueAt) {
      await this.sequencesRepository.setNextFollowUpAt(lead.id, dueAt);
      return;
    }

    if (lead.sequence_step > intervals.length) {
      await this.sequencesRepository.markNotInterested(lead.id);
      await recordActivity({
        organizationId: lead.organization_id,
        type: "closed",
        title: `No reply after follow-ups — closed ${leadLabel(lead)}`,
        leadId: lead.id,
      });
      return;
    }

    await this.draftFollowUp(lead, config);
  }

  private async draftFollowUp(
    lead: PgDueLead,
    config: PgSequenceConfig
  ): Promise<void> {
    const [facts, previousMessage] = await Promise.all([
      this.sequencesRepository.getFactsForLead(lead.id),
      this.sequencesRepository.getLastSentMessageBody(lead.id),
    ]);
    if (previousMessage === null) return;

    const followUpNumber = lead.sequence_step;
    const parsed = await this.generate(
      lead,
      config,
      facts,
      previousMessage,
      followUpNumber
    );
    if (parsed === null) return;

    await this.sequencesRepository.createFollowUpDraft({
      organizationId: lead.organization_id,
      leadId: lead.id,
      icpId: lead.icp_id,
      channel: lead.channel,
      subject: lead.channel === "email" ? parsed.subject : null,
      body: parsed.body,
      lengthBucket: lengthBucket(parsed.body),
    });
    await this.sequencesRepository.setNextFollowUpAt(lead.id, null);
    await recordActivity({
      organizationId: lead.organization_id,
      type: "follow_up",
      title: `Follow-up #${followUpNumber} drafted for ${leadLabel(lead)}`,
      leadId: lead.id,
    });
  }

  private async generate(
    lead: PgDueLead,
    config: PgSequenceConfig,
    facts: ReadonlyArray<PgSequenceFact>,
    previousMessage: string,
    followUpNumber: number
  ): Promise<FollowUpOutput | null> {
    try {
      const raw = await this.llm.generate({
        prompt: buildFollowUpPrompt({
          prospectName: fullName(lead),
          role: lead.role,
          company: lead.company_name ?? "",
          companyName: config.company_name,
          website: config.website,
          companyProfile: config.company_profile,
          outreachLanguage: config.outreach_language,
          facts: facts.map((fact) => ({
            text: fact.text,
            sourceUrl: fact.source_url,
          })),
          previousMessage,
          followUpNumber,
        }),
        temperature: FOLLOW_UP_TEMPERATURE,
        maxTokens: FOLLOW_UP_MAX_TOKENS,
      });
      return FollowUpOutputSchema.parse(extractJson(raw));
    } catch (error) {
      console.error(
        `[sequences] follow-up generation failed leadId=${lead.id}: ${errorMessage(error)}`
      );
      return null;
    }
  }
}
