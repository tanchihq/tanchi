export type FollowUpFact = Readonly<{ text: string; sourceUrl: string }>;

export type FollowUpContext = Readonly<{
  prospectName: string;
  role: string | null;
  company: string;
  companyName: string;
  website: string;
  companyProfile: string;
  outreachLanguage: string;
  facts: ReadonlyArray<FollowUpFact>;
  previousMessage: string;
  followUpNumber: number;
}>;

export function buildFollowUpPrompt(context: FollowUpContext): string {
  const factLines = context.facts.map(
    (fact) => `- ${fact.text} (source: ${fact.sourceUrl})`
  );

  return [
    "You are a B2B cold outreach copywriter writing a FOLLOW-UP email.",
    `This is follow-up #${context.followUpNumber}: the prospect did NOT reply to the previous email.`,
    "",
    "RULES:",
    "- Keep it SHORT (2-4 sentences). A follow-up, not a new pitch.",
    "- Reference the previous message lightly, add a fresh reason to reply (new angle or a soft nudge). Do not just resend.",
    "- Do not invent any fact about the prospect. Use only the verified facts below.",
    "- Polite, no guilt-tripping, one clear ask.",
    "",
    `Write the email (subject and body) in this language: ${context.outreachLanguage}.`,
    "",
    `Our offer: ${context.companyName} — ${context.website}`,
    context.companyProfile === "" ? "" : `About us: ${context.companyProfile}`,
    "",
    `Prospect: ${context.prospectName || "unknown"}${context.role === null ? "" : `, ${context.role}`} at ${context.company || "?"}`,
    "",
    "Verified facts (the only ones you may use):",
    factLines.length === 0 ? "- (none)" : factLines.join("\n"),
    "",
    "Previous email that got no reply:",
    context.previousMessage,
    "",
    "Respond with ONLY this JSON object, no surrounding text:",
    '{ "subject": "email subject", "body": "message body" }',
  ]
    .filter((line) => line !== "")
    .join("\n");
}
