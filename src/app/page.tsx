import type { Viewport } from "next";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

// Lets the screen extend under the notch/home indicator (safe-area insets).
export const viewport: Viewport = { viewportFit: "cover" };

export default async function Home() {
  const [{ t }, session] = await Promise.all([getTranslations(), getSession()]);
  const user = session?.user;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* App bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex h-14 items-center px-4">
          <h1 className="font-heading text-lg font-semibold">{t("Qura")}</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-4 py-6">
        {/* Profile / intro */}
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
          <section className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {t("Qura — Your city, one feed")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
              )}
            </p>
          </section>
        )}

        {/* Settings, grouped like a native settings list */}
        <section className="flex flex-col gap-2">
          <h3 className="px-1 text-xs font-medium text-muted-foreground uppercase">
            {t("Settings")}
          </h3>
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
      </main>

      {/* Primary action, pinned above the home indicator */}
      <footer className="sticky bottom-0 bg-background/80 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-xl">
        {user ? (
          <SignOutButton size="xl" className=" w-full rounded-xl" />
        ) : (
          <Button
            size="xl"
            className=" w-full rounded-xl"
            nativeButton={false}
            render={<Link href={href("login")} />}
          >
            {t("Sign in")}
          </Button>
        )}
      </footer>
    </div>
  );
}
