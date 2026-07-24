import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getGuardedUser, getPostAuthRedirect } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

import { SignupForm } from "./signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Create your profile")} — Qura` };
}

export default async function SignupPage() {
  const user = await getGuardedUser();
  if (user) redirect(getPostAuthRedirect(user));

  return (
    <div className="w-full max-w-sm">
      <SignupForm />
    </div>
  );
}
