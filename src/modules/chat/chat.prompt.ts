import type {
  PgChatMessage,
  PgLeadContext,
} from "./repository/chat/chat.entities.ts";

export const CHAT_SYSTEM =
  "You are the SweeLeads sales copilot. You help the user work on B2B outreach: discussing prospects, sharpening angles, and improving cold messages. Be concise, concrete and practical. Ground anything you say about a specific prospect ONLY in the prospect information provided below — never invent a fact, a client or a figure about a prospect. When the user asks to rewrite a message, propose the rewritten version directly.";

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
  return `Prospect ${index + 1}: ${leadName(context)}${role} at ${company}${traitLine}${dossier}${draft}`;
}

export function buildChatPrompt(
  today: string,
  contexts: ReadonlyArray<PgLeadContext>,
  history: ReadonlyArray<PgChatMessage>
): string {
  const leadSection =
    contexts.length === 0
      ? "No prospect is attached to this conversation yet."
      : contexts.map(leadBlock).join("\n\n");

  const transcript = history.map((message) =>
    message.role === "user"
      ? `User: ${message.content}`
      : `Assistant: ${message.content}`
  );

  return [
    `Today's date is ${today}.`,
    "",
    "[Attached prospects]",
    leadSection,
    "",
    "[Conversation]",
    ...transcript,
    "Assistant:",
  ].join("\n");
}
