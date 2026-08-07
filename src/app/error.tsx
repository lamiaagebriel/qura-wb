"use client";

import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { DatabaseIcon, RefreshIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/client";

/** Catches uncaught exceptions anywhere under the root layout — most
 * commonly a dead DB connection, since every page here queries Postgres
 * directly from a Server Component rather than through `fetch()`, so
 * there's no cached fallback to fall back to. Next.js hides the real
 * error message from Server Components in production (only `digest`
 * survives), so this can't reliably tell "DB is down" apart from any
 * other server-side crash — the copy below is deliberately generic. */
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
        <HugeiconsIcon icon={DatabaseIcon} className="size-6" strokeWidth={1.8} />
      </span>

      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-[17px] font-semibold">
          {t("Something went wrong")}
        </h1>
        <p className="text-muted-foreground max-w-xs text-[13.5px] leading-relaxed">
          {t(
            "We couldn't reach our servers. This is usually temporary — try again in a moment.",
          )}
        </p>
        {error.digest && (
          <p className="text-muted-foreground/60 mt-1 text-[11px]">
            {t("Reference")}: {error.digest}
          </p>
        )}
      </div>

      <Button type="button" onClick={() => unstable_retry()}>
        <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
        {t("Try again")}
      </Button>
    </div>
  );
}
