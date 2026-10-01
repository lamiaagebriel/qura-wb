import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { SignInButton } from "@/components/auth/sign-in-button";
import { UserCircleIcon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { FAKE_MY_BUSINESSES } from "@/components/profile/fake-businesses";
import { PersonalHero } from "@/components/profile/personal-hero";
import { SettingsList } from "@/components/profile/settings-list";
import { StatusScreen } from "@/components/status-screen";
import { getSession } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  // Personal / auth screen: keep it out of search results.
  return { title: t("Profile"), robots: { index: false, follow: true } };
}

/**
 * Your personal profile, then the settings. Signed out: a sign-in prompt,
 * with the settings (language, theme…) still under it.
 */
export default async function ProfilePage() {
  const [{ t }, session] = await Promise.all([getTranslations(), getSession()]);
  const user = session?.user;

  return (
    <Screen>
      <AppHeader title={t("Profile")} large />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
          {user ? (
            <section
              aria-label={user.name}
              className="flex flex-col gap-4 pt-2 pb-5"
            >
              <PersonalHero
                profile={{
                  kind: "personal",
                  name: user.name,
                  username: user.username,
                  avatarUrl: user.image ?? null,
                  verified: false,
                  bio: user.bio ?? "",
                  // TEMPORARY: no follows yet.
                  stats: { followers: 0, following: 0 },
                }}
              />
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
          <SettingsList
            signedIn={!!user}
            // TEMPORARY: fake businesses until businesses are stored.
            businessCount={FAKE_MY_BUSINESSES.length}
          />
        </main>
      </PullToRefresh>
    </Screen>
  );
}
