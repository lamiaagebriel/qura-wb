import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

import { ForgotPasswordForm } from "./forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Forgot your password?")} — Qura` };
}

export default async function ForgotPasswordPage() {
  // Not gated the way `/login` and `/signup` are — a signed-in user can
  // still land here deliberately (e.g. they want to reset the password
  // for a different account, or they're signed in on another device and
  // forgot this one's password). `user` is only ever used to prefill the
  // email field as a convenience, never to skip or restrict the form.
  const user = await getCurrentUser();

  return (
    <div className="w-full max-w-sm">
      <ForgotPasswordForm user={user} />
    </div>
  );
}
