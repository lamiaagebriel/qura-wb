import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/actions";

import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Set a new password")} — Qura` };
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <ResetPasswordForm token={token} />
    </div>
  );
}
