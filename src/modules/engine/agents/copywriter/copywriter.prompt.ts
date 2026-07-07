import type {
  PgCopyAngle,
  PgCopyFact,
  PgEngineLead,
} from "../../repository/engine/engine.entities.ts";
import type { EngineOffer } from "../../engine.types.ts";

export type CopywriterContext = Readonly<{
  lead: PgEngineLead;
  offer: EngineOffer;
  summary: string | null;
  facts: ReadonlyArray<PgCopyFact>;
  angle: PgCopyAngle | null;
  playbook: string | null;
  isExploration: boolean;
}>;

function fullName(lead: PgEngineLead): string {
  return [lead.first_name, lead.last_name]
    .filter((part) => part !== null && part !== "")
    .join(" ");
}

export function buildCopywriterPrompt(context: CopywriterContext): string {
  const { lead, offer, summary, facts, angle, playbook, isExploration } =
    context;
  const factLines = facts.map(
    (fact) => `- ${fact.text} (source: ${fact.source_url})`
  );

  return [
    "You are a B2B cold outreach copywriter. Your message is short, personalized, and grounded ONLY in verified facts.",
    "",
    "RULES:",
    "- Do not invent any fact about the prospect. Use only the facts provided below.",
    "- Personalize from the first line with a specific fact. No generic flattery.",
    "- Get to the point, one clear ask (CTA).",
    isExploration
      ? "- EXPLORATION MODE: try a new angle or phrasing, different from usual."
      : "",
    "",
    `Write the email (subject and body) in this language: ${offer.outreachLanguage}.`,
    "",
    `Our offer: ${offer.companyName} — ${offer.website}`,
    offer.companyProfile === ""
      ? ""
      : `About us: ${offer.companyProfile}`,
    "",
    `Prospect: ${fullName(lead) || "unknown"}${lead.role === null ? "" : `, ${lead.role}`} at ${lead.company_name ?? "?"}`,
    summary === null ? "" : `Dossier summary: ${summary}`,
    "",
    "Verified facts (the only ones you may use):",
    factLines.length === 0
      ? "- (no verified fact available)"
      : factLines.join("\n"),
    "",
    angle === null
      ? ""
      : `Angle to play: ${angle.title}${angle.note === null ? "" : ` — ${angle.note}`}`,
    playbook === null ? "" : `Playbook for this ICP (what converts):\n${playbook}`,
    "",
    "Respond with ONLY this JSON object, no surrounding text:",
    '{ "subject": "email subject", "body": "message body" }',
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildAngleInferencePrompt(body: string): string {
  return [
    "Classify the dominant angle of this prospecting message.",
    "Answer with ONE single word among: event, funding, hiring, connection, social_proof, pain, curiosity.",
    "",
    "Message:",
    body,
  ].join("\n");
}
