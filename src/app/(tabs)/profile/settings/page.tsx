import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Screen } from "@/components/navigation/screen";
import { InstallAppButton } from "@/components/install-app-button";
import { ShareAppButton } from "@/components/share-app-button";
import { SignOutButton } from "@/components/sign-out-button";
import { getSession } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  // Personal / auth screen: keep it out of search results.
  return { title: t("Settings"), robots: { index: false, follow: true } };
}

/** Detail screen of the Profile tab (opens with a stack slide). */
export default async function SettingsPage() {
  const [{ t }, session] = await Promise.all([getTranslations(), getSession()]);

  return (
    <Screen>
      <AppHeader title={t("Settings")} back={href("profile")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-4">
        {/* Grouped like a native settings list */}
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
          <LocaleSwitcher />
          <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2">
            <span className="text-sm font-medium">{t("Theme")}</span>
            <ModeSwitcher />
          </div>
          <ShareAppButton />
          <InstallAppButton />
        </div>

        {session && <SignOutButton size="xl" className="w-full rounded-xl" />}
      </main>
    </Screen>
  );
}
