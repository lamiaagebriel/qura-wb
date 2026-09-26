"use client";

import Link from "next/link";

import { Alert02Icon, HugeiconsIcon, Home01Icon, RefreshIcon } from "@/components/icons";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";

/** Any unexpected error inside a page (e.g. the database is unreachable). */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useLocale();

  return (
    <StatusScreen
      icon={Alert02Icon}
      title={t("Something went wrong")}
      description={t("We couldn't load this page. Please try again.")}
    >
      <Button size="xl" className="w-full rounded-xl" onClick={() => retry()}>
        <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
        {t("Try again")}
      </Button>
      <Button
        size="xl"
        variant="ghost"
        className="w-full rounded-xl"
        nativeButton={false}
        render={<Link href={href("home")} />}
      >
        <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
        {t("Go to home")}
      </Button>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground" dir="ltr">
          {error.digest}
        </p>
      )}
    </StatusScreen>
  );
}
