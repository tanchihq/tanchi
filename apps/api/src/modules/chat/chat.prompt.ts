import type {
  PgChatMessage,
  PgLeadContext,
} from "./repository/chat/chat.entities.ts";

export const CHAT_SYSTEM =
  "You are the SweeLeads sales copilot. You help the user work on B2B outreach: discussing prospects, sharpening angles, and improving cold messages. Be concise, concrete and practical. Ground anything you say about a specific prospect ONLY in verified, sourced information — never invent a fact, a client or a figure about a prospect.\n\nYou can take actions via tools:\n- create_lead: add a new prospect card the user found themselves, and attach it to this conversation. It accepts an optional ICP (icpName/icpId) to associate — use one from the Available ICPs listed in context.\n- update_lead: update an EXISTING lead's contact details or identity (email, phone, LinkedIn, Instagram, name, role, channel). Whenever the user gives contact info for a lead that already exists (e.g. the email after the card was created), call update_lead to save it — never tell the user to edit the card in the app.\n- assign_icp: associate an existing lead with an EXISTING ICP from the Available ICPs. You cannot CREATE a new ICP — creating ICPs is done in the app's strategy setup, so if the user asks for an ICP that is not in the Available ICPs list, tell them to create it in the app first.\n- fetch_context: research a prospect/company on the web for fresh sourced context before writing.\n- rewrite_draft: write or rewrite a lead's outreach draft with a given angle and save it.\n- plan_follow_ups: arm the automatic follow-up sequence for a lead. The app then drafts each follow-up on the cadence in the user's follow-up settings, and the user reviews before sending. You do not choose arbitrary dates — cadence is a setting. If the last message was sent outside the app, pass it (lastMessage + lastSentAt) so the sequence is anchored correctly; if you don't have a sent message to anchor on, ask the user for it.\nUse a tool only when the user actually wants that action. Each attached prospect is listed with its leadId — always pass that exact leadId to the tools; NEVER ask the user for a lead ID, you already have it. When creating a lead, if the user did not give the prospect's email, ask for it — a lead without an email cannot be contacted by email (create it anyway if they don't have it, but flag that it's missing). When the user names an ICP, match it to the Available ICPs and pass its id. When you write or rewrite a message, only use sourced facts (from the dossier or from fetch_context). After acting, tell the user plainly what you did. Otherwise, just answer.";

export function buildResearchPrompt(target: string, today: string): string {
  return [
    `Today's date is ${today}.`,
    `Research this B2B prospect / company on the web: ${target}.`,
    "Use web_fetch of the real website first, then reputable sources.",
    "Return 3 to 6 SHORT factual bullet points that would help write a relevant cold email (recent news, funding, hiring, product, positioning).",
    "Each bullet MUST end with its source URL in parentheses. Only include verifiable facts you actually retrieved. No inference, no filler.",
    "If you cannot verify anything, say so plainly.",
  ].join("\n");
}

export type RewriteContext = Readonly<{
  name: string;
  role: string | null;
  company: string | null;
  facts: ReadonlyArray<Readonly<{ text: string; source_url: string }>>;
  sourcedContext: string | null;
  currentDraft: string | null;
  angle: string | null;
  instructions: string | null;
  outreachLanguage: string;
  today: string;
}>;

export function buildRewritePrompt(context: RewriteContext): string {
  const factLines =
    context.facts.length === 0
      ? "- (no verified fact available — rely on the user's instructions and do not invent any)"
      : context.facts
          .map((fact) => `- ${fact.text} (source: ${fact.source_url})`)
          .join("\n");
  const role = context.role === null ? "" : `, ${context.role}`;

  return [
    `Today's date is ${context.today}.`,
    "You are a B2B cold outreach copywriter. Write a short, personalized email, grounded ONLY in the verified facts below. Do not invent anything about the prospect.",
    "",
    `Prospect: ${context.name}${role} at ${context.company ?? "?"}`,
    "",
    "Verified facts (the only ones you may use):",
    factLines,
    "",
    context.sourcedContext === null
      ? ""
      : `Additional sourced context (each fact carries a URL — you may use these too):\n${context.sourcedContext}`,
    context.angle === null ? "" : `Angle to play: ${context.angle}`,
    context.instructions === null
      ? ""
      : `User instructions: ${context.instructions}`,
    context.currentDraft === null
      ? ""
      : `Current draft to improve:\n${context.currentDraft}`,
    "",
    `Write in this language: ${context.outreachLanguage}.`,
    "End on a single clear CTA. Do NOT add any sign-off or signature.",
    "",
    'Respond with ONLY this JSON object, no surrounding text:',
    '{ "subject": "email subject", "body": "message body" }',
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function leadName(context: PgLeadContext): string {
  const name = [context.first_name, context.last_name]
    .filter((part) => part !== null && part !== "")
    .join(" ");
  return name === "" ? "Unknown" : name;
}

function leadBlock(context: PgLeadContext, index: number): string {
  const role = context.role === null ? "" : `, ${context.role}`;
  const company = context.company_name ?? "unknown company";
  const traits = [context.company_sector, context.company_size]
    .filter((part) => part !== null && part !== "")
    .join(", ");
  const traitLine = traits === "" ? "" : ` (${traits})`;
  const draft =
    context.draft_body === null
      ? ""
      : `\nLatest message${context.draft_subject === null ? "" : ` — subject: ${context.draft_subject}`}:\n${context.draft_body}`;
  const dossier =
    context.summary === null ? "" : `\nDossier: ${context.summary}`;
  return `Prospect ${index + 1} (leadId: ${context.lead_id}): ${leadName(context)}${role} at ${company}${traitLine}${dossier}${draft}`;
}

export function buildChatPrompt(
  today: string,
  icps: ReadonlyArray<Readonly<{ id: string; name: string }>>,
  contexts: ReadonlyArray<PgLeadContext>,
  history: ReadonlyArray<PgChatMessage>
): string {
  const leadSection =
    contexts.length === 0
      ? "No prospect is attached to this conversation yet."
      : contexts.map(leadBlock).join("\n\n");

  const icpSection =
    icps.length === 0
      ? "No ICP is configured yet (ICPs are created in the app's strategy setup)."
      : icps.map((icp) => `- ${icp.name} (icpId: ${icp.id})`).join("\n");

  const transcript = history.map((message) =>
    message.role === "user"
      ? `User: ${message.content}`
      : `Assistant: ${message.content}`
  );

  return [
    `Today's date is ${today}.`,
    "",
    "[Available ICPs]",
    icpSection,
    "",
    "[Attached prospects]",
    leadSection,
    "",
    "[Conversation]",
    ...transcript,
    "Assistant:",
  ].join("\n");
}
