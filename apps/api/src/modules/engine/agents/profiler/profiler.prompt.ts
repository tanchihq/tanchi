import type { PgEngineLead } from "../../repository/engine/engine.entities.ts";
import type { EngineOffer } from "../../engine.types.ts";

function fullName(lead: PgEngineLead): string {
  return [lead.first_name, lead.last_name]
    .filter((part) => part !== null && part !== "")
    .join(" ");
}

export function buildProfilerPrompt(
  lead: PgEngineLead,
  offer: EngineOffer,
  today: string
): string {
  return [
    "You are a sales intelligence analyst. Your mission is to VERIFY, never to invent.",
    "",
    `Today's date is ${today}. Every judgment about recency is made relative to this date.`,
    "",
    "HARD RULES, non-negotiable:",
    "- Only cite a fact you actually retrieved via WebFetch. Every fact carries a VERBATIM quote (copied word for word from the page) and its exact URL.",
    "- Never a client, logo or reference unless it appears on the prospect's OWN website or LinkedIn (provenance 'own_source'). A fact from press or a third party = 'third_party'.",
    "- WebFetch the real website; prefer it over search snippets.",
    "- Anything unverifiable does not go in. No 'probably', no inference. A short dossier beats a false one.",
    "- Time-sensitive facts (news, funding, hiring, events) MUST carry their date/period in the fact text. A fact is only 'recent' if it is close to today. An event already passed, or a signal older than ~3 months, is NOT a fresh hook: do not build an event/funding/hiring angle on it — either drop that angle or rank it low. Never present a past-dated event as upcoming.",
    "- linkedinUrl / instagramUrl: include the prospect's real profile URL ONLY if you actually found it on their own website or a source you fetched. Never guess, never build a URL from the name. If not found, use null.",
    "",
    "Prospect to research:",
    `- Name: ${fullName(lead) || "unknown"}`,
    lead.role === null ? "" : `- Role: ${lead.role}`,
    `- Company: ${lead.company_name ?? "unknown"}`,
    lead.company_domain === null ? "" : `- Domain: ${lead.company_domain}`,
    lead.linkedin_url === null ? "" : `- LinkedIn: ${lead.linkedin_url}`,
    "",
    "Target profile (ICP):",
    `- ${lead.icp_name ?? ""} — ${lead.icp_description ?? ""}`,
    lead.icp_angle === null ? "" : `- Preferred angle: ${lead.icp_angle}`,
    lead.icp_golden_rule === null
      ? ""
      : `- Golden rule: ${lead.icp_golden_rule}`,
    "",
    "What our client sells (to connect prospect → offer):",
    `- ${offer.companyName} — ${offer.website}`,
    "",
    `Write the summary, angle titles and notes in this language: ${offer.outreachLanguage}. Keep each fact quote VERBATIM in its source language.`,
    "",
    "Research the prospect (real website, team/about page, recent press, funding, hiring), extract verified facts, synthesize, propose 3 to 5 ranked angles (each tied to a fact via factIndex), qualify A/B/C, give a 0-100 score, and choose the best channel.",
    "",
    "Respond with ONLY this JSON object, no surrounding text:",
    JSON.stringify(
      {
        summary: "...",
        qualification: "A|B|C",
        score: 0,
        channel: "email|linkedin|whatsapp|instagram|sms|call",
        channelReason: "...",
        linkedinUrl: "https://www.linkedin.com/in/... or null",
        instagramUrl: "https://www.instagram.com/... or null",
        facts: [
          {
            text: "...",
            sourceUrl: "https://...",
            quote: "verbatim excerpt copied from the page",
            provenance: "own_source|third_party",
          },
        ],
        angles: [
          {
            rank: 1,
            title: "...",
            note: "...",
            angleType: "event|funding|hiring|connection|social_proof|pain|curiosity",
            factIndex: 0,
            chosen: true,
          },
        ],
      },
      null,
      2
    ),
  ]
    .filter((line) => line !== "")
    .join("\n");
}
