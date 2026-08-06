import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { SettingsSheet } from "@/components/settings-sheet";
import { getCurrentUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";
import { getFollowCounts } from "@/lib/profile/queries";

import { ProfileTabs } from "../profile-tabs";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Profile")} — Qura` };
}

export default async function AccountPage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getLocale()]);

  const settingsLabels = {
    settings: t("Settings"),
    language: t("Language"),
    theme: t("Theme"),
    about: t("About the app"),
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <div className="container flex items-center justify-between px-4 pt-5">
          <h1 className="text-foreground text-[28px] font-bold tracking-tight">
            {t("Profile")}
          </h1>
          <SettingsSheet labels={settingsLabels} />
        </div>

        <div className="container flex flex-col gap-6 px-4">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-foreground text-[15px] font-semibold">
              {t("Sign in to save favorites and manage your business")}
            </p>
            <div className="flex w-full max-w-64 flex-col gap-2">
              <Button asChild>
                <Link href="/login">{t("Sign in")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/signup">{t("Create an account")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { followers, following } = await getFollowCounts(user.id);
  const shareUrl = `${process.env.APP_URL ?? ""}/profile/${user.username}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="container flex items-center justify-between px-4 pt-5">
        <h1 className="text-foreground text-[15px] font-semibold">
          @{user.username}
        </h1>
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          aria-label={t("Settings")}
        >
          <Link href="/account/settings">
            <HugeiconsIcon icon={Settings01Icon} />
          </Link>
        </Button>
      </div>

      <div className="container flex flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-[20px] font-bold tracking-tight">
              {user.name}
            </h2>
            {user.bio && (
              <p className="text-foreground text-[13.5px] leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            )}
          </div>
          <Avatar size="lg" className="size-20!">
            <AvatarImage src={user.image!} alt={user.name} />
            <AvatarFallback>{user.name}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex items-center gap-4 text-[13px]">
          <Link
            href="/account/followers"
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="text-foreground font-semibold">{followers}</span>{" "}
            {t("followers")}
          </Link>
          <Link
            href="/account/following"
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="text-foreground font-semibold">{following}</span>{" "}
            {t("following")}
          </Link>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/account/edit">{t("Edit profile")}</Link>
          </Button>
          <CopyLinkButton
            value={shareUrl}
            copyLabel={t("Share profile")}
            copiedLabel={t("Link copied")}
            successToast={t("Profile link copied to clipboard.")}
            variant="outline"
            className="flex-1"
          />
        </div>
      </div>

      <ProfileTabs userId={user.id} currentUserId={user.id} />
    </div>
  );
}
