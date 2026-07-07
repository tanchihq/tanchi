import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { htmlToText } from "@shared/web";

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
}>;

export async function sendEmail(
  credentials: MailboxCredentials,
  message: MailboxSendMessage
): Promise<void> {
  const transporter = createSmtpTransport(credentials);
  try {
    await transporter.sendMail({
      from: `"${message.fromName}" <${message.fromEmail}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  } finally {
    transporter.close();
  }
}

export type MailboxReply = Readonly<{
  fromEmail: string;
  subject: string;
  text: string;
  receivedAt: Date;
}>;

function extractBodyText(source: Buffer): string {
  const raw = source.toString("utf8");
  const separator = raw.indexOf("\r\n\r\n");
  const body = separator === -1 ? raw : raw.slice(separator + 4);
  return htmlToText(body).slice(0, 5000);
}

export async function fetchRecentReplies(
  credentials: MailboxCredentials,
  since: Date
): Promise<ReadonlyArray<MailboxReply>> {
  const client = new ImapFlow({
    host: credentials.imapHost,
    port: credentials.imapPort,
    secure: credentials.imapSecure,
    auth: { user: credentials.username, pass: credentials.secret },
    logger: false,
  });

  const replies: Array<MailboxReply> = [];
  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    const uids = await client.search({ since }, { uid: true });
    if (uids === false || uids.length === 0) return [];
    for await (const message of client.fetch(
      uids,
      { envelope: true, source: true },
      { uid: true }
    )) {
      const from = message.envelope?.from?.[0]?.address ?? null;
      const source = message.source;
      if (from === null || source === undefined) continue;
      replies.push({
        fromEmail: from.toLowerCase(),
        subject: message.envelope?.subject ?? "",
        text: extractBodyText(source),
        receivedAt: message.envelope?.date ?? since,
      });
    }
  } finally {
    lock.release();
    await client.logout();
  }
  return replies;
}
