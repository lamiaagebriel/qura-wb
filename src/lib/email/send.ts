import "server-only";

import nodemailer from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Built once, reused across requests/emails — `nodemailer.createTransport`
 * itself only builds a connection pool config, it doesn't open a
 * connection until the first `sendMail`, so there's no cost to holding
 * onto this at module scope.
 *
 * Returns `null` (rather than throwing) when SMTP isn't configured, so
 * local dev without `.env` SMTP values still runs — `sendEmail` falls back
 * to logging the email instead of sending it in that case.
 */
function getTransporter(): nodemailer.Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;

  if (!transporter) {
    const port = Number(SMTP_PORT);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 = implicit TLS, 587/others = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const transport = getTransporter();

  if (!transport) {
    console.warn(
      `[email] SMTP isn't configured (need SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env) — logging instead of sending to ${to}`,
    );
    console.log(`\n[email] → ${to}\nSubject: ${subject}\n${text ?? html}\n`);
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    // Better Auth calls `sendEmail` (via `sendVerificationEmail` /
    // `sendResetPassword` in `lib/auth/auth.ts`) through
    // `runInBackgroundOrAwait`, which swallows whatever this throws and
    // only logs it — a failed send otherwise looks identical to a
    // successful one from the UI's point of view ("check your email").
    // Logging here too means a bad SMTP password or a Gmail app-password
    // issue shows up clearly in the server console instead of just
    // silently not arriving.
    console.error(`[email] Failed to send to ${to}:`, err);
    throw err;
  }
}
