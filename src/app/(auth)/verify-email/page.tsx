import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getGuardedUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

import { VerifyEmailView } from "./verify-email-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Verify your email")} — Qura` };
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;

  // Clicking the emailed link proves ownership via the token itself, so
  // that flow works regardless of whether this browser has a session (e.g.
  // opened on a different device) — only the "pending" screen below, which
  // has nothing to check against yet, needs a signed-in, unverified user.
  if (token) {
    return (
      <div className="w-full max-w-sm">
        <VerifyEmailView token={token} />
      </div>
    );
  }

  const user = await getGuardedUser();
  if (!user) redirect("/login");
  if (user.emailVerified) redirect("/dashboard");

  return (
    <div className="w-full max-w-sm">
      <VerifyEmailView email={user.email} />
    </div>
  );
}
