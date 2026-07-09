export function buildClassifyPrompt(replyText: string, today: string): string {
  return [
    "Classify a prospect's reply to a cold outreach email.",
    `Today's date is ${today}. Read any date the prospect mentions (a period, a month, "next quarter") relative to it.`,
    "Answer with ONE single word among:",
    "- positive: interested, wants a meeting or to know more.",
    "- negative: refusal, not interested, unsubscribe.",
    "- later: interested but later, to recontact in the future.",
    "- neutral: auto-reply, out of office, or off-topic.",
    "",
    "Prospect reply:",
    replyText,
  ].join("\n");
}
