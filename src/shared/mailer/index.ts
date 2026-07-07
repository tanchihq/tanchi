import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../env.ts";

const RESEND_SMTP_HOST = "smtp.resend.com";
const RESEND_SMTP_PORT = 465;
const RESEND_SMTP_USER = "resend";

export type SystemEmail = Readonly<{
  to: string;
  subject: string;
  html: string;
  text: string;
}>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createTransport(): Transporter | null {
  if (env.MAIL_SMTP_HOST !== undefined) {
    return nodemailer.createTransport({
      host: env.MAIL_SMTP_HOST,
      port: env.MAIL_SMTP_PORT,
      secure: env.MAIL_SMTP_SECURE === "true",
      ...(env.MAIL_SMTP_USER !== undefined &&
        env.MAIL_SMTP_PASS !== undefined && {
          auth: { user: env.MAIL_SMTP_USER, pass: env.MAIL_SMTP_PASS },
        }),
    });
  }
  if (env.RESEND_API_KEY !== undefined) {
    return nodemailer.createTransport({
      host: RESEND_SMTP_HOST,
      port: RESEND_SMTP_PORT,
      secure: true,
      auth: { user: RESEND_SMTP_USER, pass: env.RESEND_API_KEY },
    });
  }
  return null;
}

const transport = createTransport();

export async function sendSystemEmail(email: SystemEmail): Promise<void> {
  if (transport === null) {
    console.log(
      `[mailer] aucun SMTP configuré (dev) → ${email.to} : ${email.subject}`
    );
    return;
  }
  try {
    await transport.sendMail({
      from: env.RESEND_FROM_EMAIL,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error(
      `[mailer] envoi échoué → ${email.to} (${email.subject}) : ${errorMessage(error)}`
    );
  }
}
