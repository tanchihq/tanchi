import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { isPublicHost } from "@shared/web";
import { parseInboundEmail, type InboundEmail } from "@shared/mail-parse";

export type { InboundEmail } from "@shared/mail-parse";

const ALLOWED_SMTP_PORTS: ReadonlySet<number> = new Set([25, 465, 587, 2525]);
const ALLOWED_IMAP_PORTS: ReadonlySet<number> = new Set([143, 993]);

export function isAllowedSmtpPort(port: number): boolean {
  return ALLOWED_SMTP_PORTS.has(port);
}

export function isAllowedImapPort(port: number): boolean {
  return ALLOWED_IMAP_PORTS.has(port);
}

async function assertMailEndpoint(
  host: string,
  port: number,
  allowed: (port: number) => boolean
): Promise<void> {
  if (!allowed(port)) throw new Error("mail port not allowed");
  if (!(await isPublicHost(host))) throw new Error("mail host not allowed");
}

function hasLineBreak(value: string): boolean {
  return /[\r\n]/.test(value);
}

function assertNoHeaderInjection(value: string): void {
  if (hasLineBreak(value)) throw new Error("mail header injection detected");
}

export type MailboxCredentials = Readonly<{
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  secret: string;
}>;

export type MailboxVerifyResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: string }>;

const SMTP_CONNECTION_TIMEOUT_MS = 10000;
const SMTP_GREETING_TIMEOUT_MS = 10000;
const SMTP_SOCKET_TIMEOUT_MS = 20000;

function createSmtpTransport(credentials: MailboxCredentials) {
  return nodemailer.createTransport({
    host: credentials.smtpHost,
    port: credentials.smtpPort,
    secure: credentials.smtpSecure,
    requireTLS: !credentials.smtpSecure,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    auth: { user: credentials.username, pass: credentials.secret },
  });
}

async function verifySmtp(
  credentials: MailboxCredentials
): Promise<MailboxVerifyResult> {
  const transporter = createSmtpTransport(credentials);
  try {
    await assertMailEndpoint(
      credentials.smtpHost,
      credentials.smtpPort,
      isAllowedSmtpPort
    );
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    transporter.close();
  }
}

async function verifyImap(
  credentials: MailboxCredentials
): Promise<MailboxVerifyResult> {
  const client = new ImapFlow({
    host: credentials.imapHost,
    port: credentials.imapPort,
    secure: credentials.imapSecure,
    auth: {
      user: credentials.username,
      pass: credentials.secret,
    },
    logger: false,
  });
  try {
    await assertMailEndpoint(
      credentials.imapHost,
      credentials.imapPort,
      isAllowedImapPort
    );
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyMailbox(
  credentials: MailboxCredentials
): Promise<MailboxVerifyResult> {
  const smtp = await verifySmtp(credentials);
  if (!smtp.ok) return smtp;
  return verifyImap(credentials);
}

export type MailboxSendMessage = Readonly<{
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string | null;
  references?: ReadonlyArray<string>;
}>;

export type MailboxSendResult = Readonly<{ messageId: string }>;

function messageIdDomain(fromEmail: string): string {
  const domain = fromEmail.slice(fromEmail.indexOf("@") + 1).trim().toLowerCase();
  return /^[a-z0-9.-]+$/.test(domain) && domain !== "" ? domain : "tanchi.local";
}

function generateMessageId(fromEmail: string): string {
  return `<${Bun.randomUUIDv7()}@${messageIdDomain(fromEmail)}>`;
}

export async function sendEmail(
  credentials: MailboxCredentials,
  message: MailboxSendMessage
): Promise<MailboxSendResult> {
  const transporter = createSmtpTransport(credentials);
  const messageId = generateMessageId(message.fromEmail);
  const references = message.references ?? [];
  const inReplyTo = message.inReplyTo ?? null;
  try {
    await assertMailEndpoint(
      credentials.smtpHost,
      credentials.smtpPort,
      isAllowedSmtpPort
    );
    assertNoHeaderInjection(message.to);
    assertNoHeaderInjection(message.subject);
    assertNoHeaderInjection(message.fromName);
    assertNoHeaderInjection(message.fromEmail);
    if ([inReplyTo ?? "", ...references].some(hasLineBreak)) {
      throw new Error("mail header injection detected");
    }
    await transporter.sendMail({
      from: `"${message.fromName}" <${message.fromEmail}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      messageId,
      ...(inReplyTo !== null && { inReplyTo }),
      ...(references.length > 0 && { references: [...references] }),
    });
    return { messageId };
  } finally {
    transporter.close();
  }
}

const ALL_MAIL_SPECIAL_USE = "\\All";
const EXTRA_SCANNED_SPECIAL_USES: ReadonlyArray<string> = ["\\Archive", "\\Junk"];

async function scannedMailboxPaths(
  client: ImapFlow
): Promise<ReadonlyArray<string>> {
  const mailboxes = await client.list();
  const pathFor = (specialUse: string): string | null =>
    mailboxes.find((mailbox) => mailbox.specialUse === specialUse)?.path ?? null;
  const allMail = pathFor(ALL_MAIL_SPECIAL_USE);
  const extras = EXTRA_SCANNED_SPECIAL_USES.map(pathFor).filter(
    (path): path is string => path !== null && path !== "INBOX"
  );
  return allMail === null
    ? ["INBOX", ...extras]
    : [allMail, ...extras.filter((path) => path !== allMail)];
}

async function fetchSourcesSince(
  client: ImapFlow,
  path: string,
  since: Date
): Promise<ReadonlyArray<Buffer>> {
  const sources: Array<Buffer> = [];
  const lock = await client.getMailboxLock(path);
  try {
    const uids = await client.search({ since }, { uid: true });
    if (uids === false || uids.length === 0) return [];
    for await (const message of client.fetch(
      uids,
      { source: true },
      { uid: true }
    )) {
      if (message.source !== undefined) sources.push(message.source);
    }
  } finally {
    lock.release();
  }
  return sources;
}

async function parseSources(
  sources: ReadonlyArray<Buffer>
): Promise<ReadonlyArray<InboundEmail>> {
  const parsed = await Promise.all(
    sources.map((source) =>
      parseInboundEmail(source).catch((error: unknown) => {
        console.error(
          `[mailbox] could not parse an inbound message: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return null;
      })
    )
  );
  const emails = parsed.filter(
    (email): email is InboundEmail => email !== null && email.fromEmail !== ""
  );
  const seen = new Set<string>();
  return emails.filter((email) => {
    const key =
      email.messageId ?? `${email.fromEmail}|${email.subject}|${email.text.slice(0, 200)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchRecentReplies(
  credentials: MailboxCredentials,
  since: Date
): Promise<ReadonlyArray<InboundEmail>> {
  const client = new ImapFlow({
    host: credentials.imapHost,
    port: credentials.imapPort,
    secure: credentials.imapSecure,
    auth: { user: credentials.username, pass: credentials.secret },
    logger: false,
  });
  client.on("error", (error: Error) => {
    console.error(`[mailbox] imap error: ${error.message}`);
  });

  await assertMailEndpoint(
    credentials.imapHost,
    credentials.imapPort,
    isAllowedImapPort
  );
  await client.connect();
  const sources: Array<Buffer> = [];
  try {
    const paths = await scannedMailboxPaths(client);
    for (const path of paths) {
      sources.push(...(await fetchSourcesSince(client, path, since)));
    }
  } finally {
    await client.logout();
  }
  return parseSources(sources);
}
