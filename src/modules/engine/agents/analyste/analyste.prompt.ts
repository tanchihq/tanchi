import type {
  PgEngineIcp,
  PgIcpEdit,
  PgMessageOutcomeRow,
} from "../../repository/engine/engine.entities.ts";

export const PLAYBOOK_SYSTEM =
  "You are the Analyst of a B2B outreach system. You distill what actually converts into a short, natural-language playbook that another agent (the copywriter) reads before writing. You are rigorous: you never invent a pattern the data does not support, and you optimize only for positive replies and booked meetings — never opens.";

export type PlaybookPromptInput = Readonly<{
  icp: PgEngineIcp;
  statsText: string;
  examples: ReadonlyArray<PgMessageOutcomeRow>;
  edits: ReadonlyArray<PgIcpEdit>;
  previousPlaybook: string | null;
  outreachLanguage: string;
  today: string;
  totalSent: number;
}>;

function exampleLines(
  examples: ReadonlyArray<PgMessageOutcomeRow>
): ReadonlyArray<string> {
  if (examples.length === 0) return ["(none yet)"];
  return examples.map((example, index) => {
    const subject =
      example.subject === null ? "" : `Subject: ${example.subject}\n`;
    return `#${index + 1} — ${subject}${example.body}`;
  });
}

function editLines(edits: ReadonlyArray<PgIcpEdit>): ReadonlyArray<string> {
  if (edits.length === 0) return ["(none yet)"];
  return edits.map(
    (edit, index) =>
      `#${index + 1}\nAI wrote:\n${edit.ai_version}\nHuman rewrote to:\n${edit.edited_version}`
  );
}

export function buildPlaybookPrompt(input: PlaybookPromptInput): string {
  const {
    icp,
    statsText,
    examples,
    edits,
    previousPlaybook,
    outreachLanguage,
    today,
    totalSent,
  } = input;

  return [
    `Today's date is ${today}.`,
    "",
    "ICP (the segment this playbook is for):",
    `- Name: ${icp.name}`,
    icp.archetype === null ? "" : `- Archetype: ${icp.archetype}`,
    `- Description: ${icp.description}`,
    icp.angle === null ? "" : `- Preferred angle at setup: ${icp.angle}`,
    icp.golden_rule === null ? "" : `- Golden rule: ${icp.golden_rule}`,
    "",
    `Sample size: ${totalSent} message(s) sent to this ICP in the analysis window.`,
    "",
    "Attribute stats (reward = positive reply / meeting, never opens):",
    statsText === "" ? "(no sent-message data yet)" : statsText,
    "",
    "Winning messages (got a positive reply):",
    ...exampleLines(examples),
    "",
    "Human edits of AI drafts (the highest-value signal — what the human adds is usually a prospect-specific insight):",
    ...editLines(edits),
    "",
    previousPlaybook === null
      ? ""
      : `Current playbook (refine and update it, keep what still holds, do not discard blindly):\n${previousPlaybook}\n`,
    "Write the updated playbook for this ICP:",
    "- Ground every claim in the data above. If the sample is small, say so explicitly and stay conservative — do not overfit to one or two messages.",
    "- Prioritize the lesson from the human edits: tell the copywriter concretely what to do differently.",
    "- Keep it short: a handful of bullet points, actionable, no filler, no preamble.",
    `- Write it in this language: ${outreachLanguage}.`,
    "- Output only the playbook text, nothing else.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
