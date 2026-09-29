import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { SignInButton } from "@/components/auth/sign-in-button";
import {
  HugeiconsIcon,
  Settings01Icon,
  UserCircleIcon,
} from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StackLink } from "@/components/navigation/stack-link";
import { StatusScreen } from "@/components/status-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  // Personal / auth screen: keep it out of search results.
  return { title: t("Profile"), robots: { index: false, follow: true } };
}

/** Works signed in (profile) and signed out (sign-in prompt). */
export default async function ProfilePage() {
  const [{ t }, session] = await Promise.all([getTranslations(), getSession()]);
  const user = session?.user;

  return (
    <Screen>
      <AppHeader
        title={t("Profile")}
        large
        action={
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label={t("Settings")}
            nativeButton={false}
            render={<StackLink href={href("settings")} />}
          >
            <HugeiconsIcon
              icon={Settings01Icon}
              strokeWidth={2}
              className="size-6"
            />
          </Button>
        }
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-4">
          {user ? (
            <>
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
            </>
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
        </main>
      </PullToRefresh>
    </Screen>
  );
}
