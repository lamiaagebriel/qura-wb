import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { SignInButton } from "@/components/auth/sign-in-button";
import { UserCircleIcon } from "@/components/icons";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { StatusScreen } from "@/components/status-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSession } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Profile") };
}

/** Works signed in (profile) and signed out (sign-in prompt). */
export default async function ProfilePage() {
  const [{ t }, session] = await Promise.all([getTranslations(), getSession()]);
  const user = session?.user;

  return (
    <>
      <AppHeader title={t("Profile")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-6">
        {user ? (
          <section className="flex items-center gap-4">
            <Avatar className="size-16">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="text-xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground" dir="ltr">
                @{user.username}
              </p>
            </div>
          </section>
        ) : (
          <StatusScreen
            icon={UserCircleIcon}
            title={t("Sign in to Qura")}
            description={t("Sign in to see your profile.")}
            inline
          >
            <SignInButton size="xl" className="w-full rounded-xl" />
          </StatusScreen>
        )}

        {/* Settings, grouped like a native settings list */}
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-medium text-muted-foreground uppercase">
            {t("Settings")}
          </h2>
          <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
            <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2">
              <span className="text-sm font-medium">{t("Language")}</span>
              <LocaleSwitcher />
            </div>
            <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2">
              <span className="text-sm font-medium">{t("Theme")}</span>
              <ModeSwitcher />
            </div>
          </div>
        </section>

        {user && <SignOutButton size="xl" className="w-full rounded-xl" />}
      </main>
    </>
  );
}
