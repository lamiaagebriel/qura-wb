import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, User } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { ProfileSwitcher } from "@/components/profile-switcher";
import { SettingsSheet } from "@/components/settings-sheet";
import { getCurrentUser } from "@/lib/auth/guard";
import { getBusinessBlock } from "@/lib/business/queries";
import {
  getActiveIdentity,
  getSwitchableIdentities,
} from "@/lib/identity/active";
import { getLocale } from "@/lib/i18n/actions";
import { getFollowCounts } from "@/lib/profile/queries";

import { ProfileTabs } from "../profile-tabs";
import { AppHeader } from "@/components/app-header";

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

  const [identity, identities] = await Promise.all([
    getActiveIdentity(),
    getSwitchableIdentities(),
  ]);
  // Both derive from the same session `getCurrentUser()` already checked
  // above, so neither can actually be null here — this only satisfies
  // the type checker (both functions are written to also work when
  // signed out, for callers that haven't already gated on that).
  if (!identity) return null;

  const [{ followers, following }, block] = await Promise.all([
    getFollowCounts(identity.id),
    identity.isBusiness ? getBusinessBlock(identity.id) : Promise.resolve(null),
  ]);
  const shareUrl = `${process.env.APP_URL ?? ""}/profile/${identity.username}`;
  const editHref = identity.isBusiness ? "/account/business" : "/account/edit";

  return (
    <div className="flex flex-col gap-5">
      <AppHeader
        title={
          <ProfileSwitcher identities={identities} activeId={identity.id} />
        }
        showBack={false}
        action={
          <Link
            href="/account/settings"
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
            })}
          >
            <HugeiconsIcon icon={Settings01Icon} />
          </Link>
        }
      />

      <div className="container flex flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-[20px] font-bold tracking-tight">
              {identity.name}
            </h2>
            {identity.bio && (
              <p className="text-foreground text-[13.5px] leading-relaxed whitespace-pre-line">
                {identity.bio}
              </p>
            )}
          </div>
          <Avatar size="lg" className="size-20!">
            <AvatarImage src={identity.image!} alt={identity.name} />
            <AvatarFallback>
              <HugeiconsIcon icon={User} />
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex items-center gap-4 text-[13px]">
          {identity.isBusiness ? (
            <Link
              href="/account/followers"
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="text-foreground font-semibold">{followers}</span>{" "}
              {t("followers")}
            </Link>
          ) : (
            <Link
              href="/account/following"
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="text-foreground font-semibold">{following}</span>{" "}
              {t("following")}
            </Link>
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={editHref}>{t("Edit profile")}</Link>
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

      <ProfileTabs
        userId={identity.id}
        currentUserId={user.id}
        stickyTop={50}
        isBusiness={identity.isBusiness}
        block={
          block
            ? { category: block.category, data: block.data as Record<string, unknown> }
            : null
        }
      />
    </div>
  );
}
