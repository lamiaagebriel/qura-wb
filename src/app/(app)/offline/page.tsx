import type { Metadata } from "next";

import { WifiDisconnected01Icon } from "@/components/icons";
import { BackButton } from "@/components/navigation/back-button";
import { RetryButton } from "@/components/offline/retry-button";
import { StatusScreen } from "@/components/status-screen";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("You're offline"), robots: { index: false, follow: false } };
}

/**
 * Shown by the service worker (public/sw.js) for pages you haven't opened
 * before while there's no connection. Saved when the worker installs.
 */
export default async function OfflinePage() {
  const { t } = await getTranslations();
  return (
    <>
      {/* Never a dead end: back to the page you came from (saved), or Home. */}
      <div className="fixed start-2 top-[calc(var(--safe-top)+0.25rem)] z-10">
        <BackButton fallback={href("home")} />
      </div>
      <StatusScreen
      icon={WifiDisconnected01Icon}
      title={t("You're offline")}
      description={t("Check your connection and try again.")}
    >
      <RetryButton />
    </StatusScreen>
    </>
  );
}
