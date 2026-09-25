import PostalMime, { type Address, type Attachment, type Email } from "postal-mime";

export type BounceReport = Readonly<{
  permanentFailures: ReadonlyArray<string>;
  originalMessageId: string | null;
}>;

export type InboundEmail = Readonly<{
  messageId: string | null;
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  referencedMessageIds: ReadonlyArray<string>;
  receivedAt: Date | null;
  isAutoReply: boolean;
  bounce: BounceReport | null;
}>;

const MAX_REPLY_TEXT_LENGTH = 5000;
const MAX_REPLY_HEADER_LOOKAHEAD = 5;

const SUBJECT_PREFIX =
  /^\s*(?:(?:re|fw|fwd|tr|aw|wg|sv|vs|rv|ref|réf|antw)\s*(?:\[\d+\])?\s*:\s*)+/i;

const QUOTE_HEADER_PATTERNS: ReadonlyArray<RegExp> = [
  /^On\s.{1,250}\swrote:\s*$/i,
  /^Le\s.{1,250}\sa\s[ée]crit\s?:\s*$/i,
  /^El\s.{1,250}\sescribi[óo]:\s*$/i,
  /^Am\s.{1,250}\sschrieb.{0,250}:\s*$/i,
  /^Il giorno\s.{1,250}\sha scritto:\s*$/i,
  /^Op\s.{1,250}\sschreef.{0,250}:\s*$/i,
  /^Em\s.{1,250}\sescreveu:\s*$/i,
  /^-{2,}\s*(?:Original Message|Message d'origine|Mensaje original|Ursprüngliche Nachricht|Messaggio originale|Oorspronkelijk bericht|Mensagem original)\s*-{2,}/i,
  /^_{10,}\s*$/,
];

const QUOTED_FROM_LINE = /^\*?(?:From|De|Von|Da|Van)\s?:\*?\s/i;

const QUOTED_FOLLOWING_LINE =
  /^\*?(?:Sent|Date|Envoy[ée]|Gesendet|Enviado|Inviato|Verzonden|To|À|A|An|Para|Aan|Objet|Subject|Betreff|Asunto|Oggetto|Onderwerp|Assunto)\s?:/i;

const AUTO_REPLY_SUBJECT =
  /^\s*(?:auto(?:matic)?[\s-]?reply|autoreply|out of (?:the )?office|ooo\b|away from|absence|absent\b|r[ée]ponse automatique|automatische antwort|abwesenheit|fuera de la oficina|respuesta autom[áa]tica|risposta automatica|fuori ufficio|afwezig|automatisch antwoord|resposta autom[áa]tica)/i;

const AUTO_REPLY_PRECEDENCE: ReadonlySet<string> = new Set([
  "auto_reply",
  "bulk",
  "junk",
  "list",
]);

const AUTO_REPLY_FLAG_HEADERS: ReadonlyArray<string> = [
  "x-autoreply",
  "x-autorespond",
  "x-autoresponder",
];

const DAEMON_LOCAL_PARTS: ReadonlySet<string> = new Set([
  "mailer-daemon",
  "postmaster",
  "mail-daemon",
  "maildaemon",
]);

const BOUNCE_SUBJECT =
  /(?:undeliver|undelivered|delivery status notification|delivery has failed|failure notice|returned mail|mail delivery failed|non remis|non distribu|impossible de remettre|unzustellbar|no se puede entregar)/i;

const PERMANENT_STATUS_CODE = /\b5\.\d{1,3}\.\d{1,3}\b/;

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

const MESSAGE_ID_TOKEN = /<[^<>\s]+>/g;

const MESSAGE_ID_HEADER = /^message-id:\s*(<[^<>\s]+>)/im;

const DELIVERY_STATUS_TYPES: ReadonlySet<string> = new Set([
  "message/delivery-status",
  "message/global-delivery-status",
]);

const ORIGINAL_MESSAGE_TYPES: ReadonlySet<string> = new Set([
  "message/rfc822",
  "message/global",
  "text/rfc822-headers",
  "message/global-headers",
]);

export function extractMessageIds(value: string | undefined): ReadonlyArray<string> {
  if (value === undefined) return [];
  const bracketed = value.match(MESSAGE_ID_TOKEN);
  if (bracketed !== null) return bracketed;
  const bare = value.trim();
  return bare.includes("@") && !/\s/.test(bare) ? [`<${bare}>`] : [];
}

export function stripSubjectPrefixes(subject: string): string {
  return subject.replace(SUBJECT_PREFIX, "").replace(/\s+/g, " ").trim();
}

export function normalizeSubject(subject: string): string {
  return stripSubjectPrefixes(subject).toLowerCase();
}

export function hasReplyPrefix(subject: string): boolean {
  return SUBJECT_PREFIX.test(subject);
}

export function replySubject(originalSubject: string): string {
  const core = stripSubjectPrefixes(originalSubject);
  return core === "" ? "" : `Re: ${core}`;
}

function isQuoteHeaderAt(lines: ReadonlyArray<string>, index: number): boolean {
  const line = (lines[index] ?? "").trim();
  const joined = `${line} ${(lines[index + 1] ?? "").trim()}`;
  if (QUOTE_HEADER_PATTERNS.some((pattern) => pattern.test(line) || pattern.test(joined))) {
    return true;
  }
  if (!QUOTED_FROM_LINE.test(line)) return false;
  return lines
    .slice(index + 1, index + 1 + MAX_REPLY_HEADER_LOOKAHEAD)
    .some((next) => QUOTED_FOLLOWING_LINE.test(next.trim()));
}

export function stripQuotedReply(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const quoteStart = lines.findIndex((_, index) => isQuoteHeaderAt(lines, index));
  const kept = (quoteStart === -1 ? lines : lines.slice(0, quoteStart)).filter(
    (line) => !line.trimStart().startsWith(">")
  );
  const reply = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return reply === "" ? text.trim() : reply;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&amp;/gi, "&");
}

export function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function headerValue(email: Email, key: string): string | null {
  return email.headers.find((header) => header.key === key)?.value ?? null;
}

export function isAutoReplyEmail(email: Email): boolean {
  const autoSubmitted = headerValue(email, "auto-submitted");
  if (autoSubmitted !== null && autoSubmitted.trim().toLowerCase() !== "no") {
    return true;
  }
  if (AUTO_REPLY_FLAG_HEADERS.some((key) => headerValue(email, key) !== null)) {
    return true;
  }
  const precedence = headerValue(email, "precedence")?.trim().toLowerCase();
  if (precedence !== undefined && AUTO_REPLY_PRECEDENCE.has(precedence)) {
    return true;
  }
  return AUTO_REPLY_SUBJECT.test(email.subject ?? "");
}

function attachmentText(attachment: Attachment): string {
  return typeof attachment.content === "string"
    ? attachment.content
    : new TextDecoder().decode(attachment.content);
}

type DeliveryStatusBlock = Readonly<Record<string, string>>;

function parseStatusBlock(block: string): DeliveryStatusBlock {
  return block
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]+/g, " ")
    .split("\n")
    .reduce<Record<string, string>>((fields, line) => {
      const separator = line.indexOf(":");
      if (separator <= 0) return fields;
      const key = line.slice(0, separator).trim().toLowerCase();
      return { ...fields, [key]: line.slice(separator + 1).trim() };
    }, {});
}

function recipientAddress(value: string | undefined): string | null {
  if (value === undefined) return null;
  const address = value.includes(";") ? value.slice(value.indexOf(";") + 1) : value;
  const cleaned = address.trim().replace(/^<|>$/g, "").toLowerCase();
  return cleaned.includes("@") ? cleaned : null;
}

function isPermanentFailure(block: DeliveryStatusBlock): boolean {
  const status = block["status"];
  if (status !== undefined) return status.trim().startsWith("5");
  return block["action"]?.trim().toLowerCase() === "failed";
}

export function parseDeliveryStatus(content: string): ReadonlyArray<string> {
  const failures = content
    .split(/\n\s*\n/)
    .map(parseStatusBlock)
    .filter((block) => block["final-recipient"] !== undefined || block["original-recipient"] !== undefined)
    .filter(isPermanentFailure)
    .map((block) =>
      recipientAddress(block["final-recipient"] ?? block["original-recipient"])
    )
    .filter((address): address is string => address !== null);
  return [...new Set(failures)];
}

function localPartOf(address: string): string {
  return address.slice(0, address.indexOf("@")).toLowerCase();
}

function isDaemonSender(fromEmail: string): boolean {
  return DAEMON_LOCAL_PARTS.has(localPartOf(fromEmail));
}

function originalMessageIdOf(email: Email, text: string): string | null {
  const original = email.attachments.find((attachment) =>
    ORIGINAL_MESSAGE_TYPES.has(attachment.mimeType.toLowerCase())
  );
  const source = original === undefined ? text : attachmentText(original);
  return source.match(MESSAGE_ID_HEADER)?.[1] ?? null;
}

export function parseBounce(
  email: Email,
  fromEmail: string,
  text: string
): BounceReport | null {
  const statusPart = email.attachments.find((attachment) =>
    DELIVERY_STATUS_TYPES.has(attachment.mimeType.toLowerCase())
  );
  if (statusPart !== undefined) {
    return {
      permanentFailures: parseDeliveryStatus(attachmentText(statusPart)),
      originalMessageId: originalMessageIdOf(email, text),
    };
  }

  const looksLikeBounce =
    isDaemonSender(fromEmail) || BOUNCE_SUBJECT.test(email.subject ?? "");
  if (!looksLikeBounce || !PERMANENT_STATUS_CODE.test(text)) return null;

  const candidates = (text.match(EMAIL_PATTERN) ?? [])
    .map((address) => address.toLowerCase())
    .filter((address) => address !== fromEmail && !isDaemonSender(address));
  return {
    permanentFailures: [...new Set(candidates)],
    originalMessageId: originalMessageIdOf(email, text),
  };
}

function firstMailbox(address: Address | undefined): Readonly<{ name: string; address: string }> {
  if (address === undefined) return { name: "", address: "" };
  if (address.address !== undefined) {
    return { name: address.name, address: address.address };
  }
  const member = address.group[0];
  return member === undefined
    ? { name: address.name, address: "" }
    : { name: member.name, address: member.address };
}

function parseDate(value: string | undefined): Date | null {
  if (value === undefined) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function bodyText(email: Email): string {
  const plain = email.text ?? "";
  if (plain.trim() !== "") return plain;
  return email.html === undefined ? "" : htmlToPlainText(email.html);
}

export async function parseInboundEmail(
  source: Uint8Array | string
): Promise<InboundEmail> {
  const email = await PostalMime.parse(source, { attachmentEncoding: "utf8" });
  const from = firstMailbox(email.from);
  const fromEmail = from.address.trim().toLowerCase();
  const fullText = bodyText(email).replace(/\u0000/g, "");
  const bounce = parseBounce(email, fromEmail, fullText);
  return {
    messageId: extractMessageIds(email.messageId)[0] ?? null,
    fromEmail,
    fromName: from.name.trim(),
    subject: email.subject ?? "",
    text: stripQuotedReply(fullText).slice(0, MAX_REPLY_TEXT_LENGTH),
    referencedMessageIds: [
      ...new Set([
        ...extractMessageIds(email.inReplyTo),
        ...extractMessageIds(email.references),
      ]),
    ],
    receivedAt: parseDate(email.date),
    isAutoReply: bounce === null && isAutoReplyEmail(email),
    bounce,
  };
}
