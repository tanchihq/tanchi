import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../env.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_REQUEST_TIMEOUT_MS = 10_000;
const SMTP_CONNECTION_TIMEOUT_MS = 10_000;

export type SystemEmail = Readonly<{
  to: string;
  subject: string;
  html: string;
  text: string;
}>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fromEmail(): string {
  return env.RESEND_FROM_EMAIL ?? env.MAIL_FROM_EMAIL;
}

function createSmtpTransport(): Transporter | null {
  if (env.MAIL_SMTP_HOST === undefined) return null;
  return nodemailer.createTransport({
    host: env.MAIL_SMTP_HOST,
    port: env.MAIL_SMTP_PORT,
    secure: env.MAIL_SMTP_SECURE === "true",
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    ...(env.MAIL_SMTP_USER !== undefined &&
      env.MAIL_SMTP_PASS !== undefined && {
        auth: { user: env.MAIL_SMTP_USER, pass: env.MAIL_SMTP_PASS },
      }),
  });
}

const smtpTransport = createSmtpTransport();

async function sendViaSmtp(
  transport: Transporter,
  email: SystemEmail
): Promise<void> {
  await transport.sendMail({
    from: fromEmail(),
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

async function sendViaResendApi(
  apiKey: string,
  email: SystemEmail
): Promise<void> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail(),
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    signal: AbortSignal.timeout(RESEND_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API ${response.status}: ${body}`);
  }
}

export async function sendSystemEmail(email: SystemEmail): Promise<void> {
  try {
    if (smtpTransport !== null) {
      await sendViaSmtp(smtpTransport, email);
      return;
    }
    if (env.RESEND_API_KEY !== undefined) {
      await sendViaResendApi(env.RESEND_API_KEY, email);
      return;
    }
    console.log(
      `[mailer] no SMTP configured (dev) → ${email.to} : ${email.subject}`
    );
  } catch (error) {
    console.error(
      `[mailer] send failed → ${email.to} (${email.subject}) : ${errorMessage(error)}`
    );
  }
}
