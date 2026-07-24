import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getGuardedUser, getPostAuthRedirect } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Sign in")} — Qura` };
}

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getGuardedUser();
  if (user) redirect(getPostAuthRedirect(user));

  const { error } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <LoginForm oauthError={error} />
    </div>
  );
}
