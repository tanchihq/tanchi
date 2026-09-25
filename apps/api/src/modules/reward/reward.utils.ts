import type { InboundEmail } from "@shared/mail-parse";
import type { PgRewardLead } from "./repository/reward/reward.entities.ts";
import { GENERIC_MAILBOX_LOCAL_PARTS } from "./reward.constants.ts";

export type Classification = "positive" | "negative" | "later" | "neutral";

const GENERIC_MAILBOX_SET: ReadonlySet<string> = new Set(
  GENERIC_MAILBOX_LOCAL_PARTS
);

export function nextStageAfterReply(
  currentStage: string,
  classification: Classification
): string {
  if (currentStage === "won") return "won";
  switch (classification) {
    case "positive":
      return "meeting";
    case "negative":
      return "not-interested";
    case "later":
      return currentStage === "meeting" ? "meeting" : "snoozed";
    case "neutral":
      return currentStage === "meeting" ? "meeting" : "replied";
  }
}

export function replyKeyOf(email: InboundEmail): string {
  if (email.messageId !== null) return email.messageId;
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(
    [
      email.fromEmail,
      email.receivedAt?.toISOString() ?? "",
      email.subject,
      email.text.slice(0, 500),
    ].join("|")
  );
  return `<fallback-${hasher.digest("hex")}@tanchi>`;
}

export function isGenericMailbox(address: string): boolean {
  const localPart = address.slice(0, address.indexOf("@")).toLowerCase();
  return GENERIC_MAILBOX_SET.has(localPart);
}

export function shouldAdoptReplier(
  lead: PgRewardLead,
  fromEmail: string
): boolean {
  if (lead.email === null) return true;
  const current = lead.email.toLowerCase();
  return current !== fromEmail && isGenericMailbox(current);
}

export function splitDisplayName(
  name: string
): Readonly<{ firstName: string | null; lastName: string | null }> {
  const parts = name
    .replace(/["']/g, "")
    .split(/\s+/)
    .filter((part) => part !== "" && !part.includes("@"));
  const [first, ...rest] = parts;
  return {
    firstName: first ?? null,
    lastName: rest.length === 0 ? null : rest.join(" "),
  };
}

export function formatReplyFrom(email: InboundEmail): string {
  return email.fromName === ""
    ? email.fromEmail
    : `${email.fromName} <${email.fromEmail}>`;
}
