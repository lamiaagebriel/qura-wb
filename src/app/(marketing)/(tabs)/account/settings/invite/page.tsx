import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { CopyLinkButton } from "@/components/copy-link-button";
import { getGuardedUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Invite friends")} — Qura` };
}

export default async function InviteFriendsPage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const { t } = await getLocale();
  const inviteUrl = `${process.env.APP_URL ?? ""}/signup?ref=${user.username}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("Invite friends")} />
      <div className="container flex flex-col gap-4 px-4">
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          {t("Share your invite link — anyone who signs up through it joins your city's feed.")}
        </p>
        <div className="border-border/60 bg-muted/40 truncate rounded-md border px-3 py-2 text-[13px]">
          {inviteUrl}
        </div>
        <CopyLinkButton
          value={inviteUrl}
          copyLabel={t("Copy invite link")}
          copiedLabel={t("Copied")}
          successToast={t("Invite link copied to clipboard.")}
          className="w-full"
        />
      </div>
    </div>
  );
}
