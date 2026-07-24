import "server-only";

import { dict, type Locale } from "@/lib/i18n/config";

import { sendEmail } from "./send";

function getAppUrl() {
  return process.env.APP_URL;
}

/** `dict.en` is `{}` by design (see `i18n/config.ts`) — same fallback-to-key
 * behavior as `t()` in `i18n/actions.ts` / `i18n/client.tsx`, just usable
 * outside a request-scoped `getLocale()` call. */
function translate(locale: Locale) {
  const d = dict[locale];
  return (key: keyof typeof dict.ar) => d[key] ?? key;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
  locale: Locale,
) {
  const t = translate(locale);
  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  const greeting = t("Hi {{name}},").replace("{{name}}", name);
  const line1 = t("Verify your email to activate your Qura profile:");
  const line2 = t(
    "This link expires in 24 hours. If you didn't create a Qura account, you can ignore this email.",
  );

  await sendEmail({
    to,
    subject: t("Verify your email — Qura"),
    text: `${greeting}\n\n${line1}\n${url}\n\n${line2}`,
    html: `<p>${greeting}</p><p>${line1}</p><p><a href="${url}">${url}</a></p><p>${line2}</p>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
  locale: Locale,
) {
  const t = translate(locale);
  const url = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  const greeting = t("Hi {{name}},").replace("{{name}}", name);
  const line1 = t("Reset your Qura password:");
  const line2 = t(
    "This link expires in 1 hour. If you didn't request this, you can ignore this email.",
  );

  await sendEmail({
    to,
    subject: t("Reset your password — Qura"),
    text: `${greeting}\n\n${line1}\n${url}\n\n${line2}`,
    html: `<p>${greeting}</p><p>${line1}</p><p><a href="${url}">${url}</a></p><p>${line2}</p>`,
  });
}
