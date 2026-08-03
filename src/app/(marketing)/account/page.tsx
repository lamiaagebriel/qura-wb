import type { Metadata } from "next";
import Link from "next/link";
import { SettingsSheet } from "@/components/settings-sheet";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guard";

import { getLocale } from "@/lib/i18n/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";

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
    notifications: t("Notifications"),
    about: t("About the app"),
    signOut: t("Sign out"),
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <div className="container flex items-center justify-between px-4 pt-5">
          <h1 className="text-foreground text-[28px] font-bold tracking-tight">
            {t("Profile")}
          </h1>
          <SettingsSheet labels={settingsLabels} user={null} />
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

  return (
    <div className="flex flex-col gap-6">
      <div className="container flex items-center justify-between px-4 pt-5">
        <h1 className="text-foreground text-[28px] font-bold tracking-tight">
          {t("Profile")}
        </h1>
        <SettingsSheet labels={settingsLabels} user={user} />
      </div>

      <div className="container flex flex-col gap-5 px-4">
        {/* Identity — tapping it opens the account switcher, the ONE place
            a user moves between their personal profile and any business
            they own (a full navigation, not a tab: each is a genuinely
            different page). */}
        <div className="flex flex-col gap-3">
          <button className="flex w-full items-center gap-3 text-start">
            <Avatar className="size-16">
              <AvatarImage src={user.image!} alt={user.name} />
              <AvatarFallback>{user.name}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div>
                <span className="text-foreground flex items-center gap-1 truncate text-[17px] font-semibold">
                  {user.name}
                  <HugeiconsIcon
                    icon={CheckmarkBadge01Icon}
                    className="size-4 shrink-0 fill-sky-500 text-white"
                  />
                </span>
                <p className="text-muted-foreground text-xs">{user.email}</p>
              </div>

              <Badge variant="outline" className="mt-2 w-fit">
                {user.role === "super_admin" ? "Super Admin" : "Business Owner"}
              </Badge>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
