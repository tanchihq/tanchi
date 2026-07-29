import type {
  PgLeadListRow,
  PgLeadRow,
  PgProspectAngle,
  PgProspectFact,
  PgProspectMessage,
  PgProspectOutcome,
} from "./repository/prospects/prospects.entities.ts";
import type * as ResponseDto from "./dto/response/index.ts";

const SIGNAL_TITLES: Readonly<Record<string, string>> = {
  sent: "Message sent",
  delivered: "Delivered",
  opened: "Opened",
  replied: "Reply received",
  positive: "Positive reply",
  meeting: "Meeting",
  deal: "Deal",
};

function titleForSignal(signal: string): string {
  return SIGNAL_TITLES[signal] ?? signal;
}

export function convertPgLeadListRowToProspectDto(
  row: PgLeadListRow
): ResponseDto.ProspectDto {
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    company: row.company_name ?? "",
    channel: row.channel,
    icp: row.icp_name ?? "",
    marketId: row.market_id,
    market: row.market_name ?? "",
    hot: row.hot,
    stage: row.stage,
    origin: row.origin,
    score: row.score,
    qualification: row.qualification,
    createdAt: row.created_at.toISOString(),
    nextFollowUpAt: row.next_follow_up_at?.toISOString() ?? null,
    snoozeUntil: row.snooze_until?.toISOString() ?? null,
  };
}

export function convertPgLeadRowToProspectDto(
  row: PgLeadRow
): ResponseDto.ProspectDto {
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    company: row.company_name ?? "",
    channel: row.channel,
    icp: row.icp_name ?? "",
    marketId: row.market_id,
    market: row.market_name ?? "",
    hot: row.hot,
    stage: row.stage,
    origin: row.origin,
    score: row.score,
    qualification: row.qualification,
    createdAt: row.created_at.toISOString(),
    nextFollowUpAt: row.next_follow_up_at?.toISOString() ?? null,
    snoozeUntil: row.snooze_until?.toISOString() ?? null,
  };
}

function convertFact(fact: PgProspectFact): ResponseDto.LeadDetailFactDto {
  return { text: fact.text, sourceUrl: fact.source_url };
}

function convertAngle(angle: PgProspectAngle): ResponseDto.LeadDetailAngleDto {
  return {
    rank: angle.rank,
    title: angle.title,
    note: angle.note ?? "",
    angleType: angle.angle_type,
    chosen: angle.chosen,
  };
}

function convertMessage(
  message: PgProspectMessage
): ResponseDto.LeadDetailMessageDto {
  return {
    id: message.id,
    channel: message.channel,
    subject: message.subject,
    body: message.body,
    status: message.status,
    sentAt: message.sent_at?.toISOString() ?? null,
  };
}

function buildTimeline(
  outcomes: ReadonlyArray<PgProspectOutcome>,
  origin: ResponseDto.OriginDto
): ReadonlyArray<ResponseDto.LeadDetailTimelineEntryDto> {
  return outcomes
    .map((outcome) => ({
      kind: outcome.stage_signal,
      at: outcome.created_at.toISOString(),
      title: titleForSignal(outcome.stage_signal),
      origin,
    }))
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

export function convertToLeadDetailDto(
  lead: PgLeadRow,
  facts: ReadonlyArray<PgProspectFact>,
  angles: ReadonlyArray<PgProspectAngle>,
  messages: ReadonlyArray<PgProspectMessage>,
  outcomes: ReadonlyArray<PgProspectOutcome>
): ResponseDto.LeadDetailDto {
  const latestMessage = messages[messages.length - 1];
  const reply = outcomes
    .filter((outcome) => outcome.reply_text !== null)
    .map((outcome) => outcome.reply_text)
    .at(-1);
  const sourceUrls = new Set(facts.map((fact) => fact.source_url));

  return {
    id: lead.id,
    firstName: lead.first_name ?? "",
    lastName: lead.last_name ?? "",
    role: lead.role,
    hot: lead.hot,
    icp: lead.icp_name ?? "",
    marketId: lead.market_id,
    market: lead.market_name ?? "",
    channel: lead.channel,
    stage: lead.stage,
    origin: lead.origin,
    company: {
      name: lead.company_name ?? "",
      sector: lead.company_sector,
      size: lead.company_size,
      hq: lead.company_hq,
    },
    siteUrl: lead.company_website,
    linkedinUrl: lead.linkedin_url,
    instagramUrl: lead.instagram_url,
    email: lead.email,
    emailStatus: lead.email_status,
    phone: lead.phone,
    facts: facts.map(convertFact),
    sourcesCount: sourceUrls.size,
    angles: angles.map(convertAngle),
    timeline: buildTimeline(outcomes, lead.origin),
    message: latestMessage === undefined ? null : convertMessage(latestMessage),
    reply: reply ?? null,
    createdAt: lead.created_at.toISOString(),
    nextFollowUpAt: lead.next_follow_up_at?.toISOString() ?? null,
    snoozeUntil: lead.snooze_until?.toISOString() ?? null,
  };
}
