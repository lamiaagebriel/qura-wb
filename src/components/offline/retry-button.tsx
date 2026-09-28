"use client";

import { HugeiconsIcon, RefreshIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

/** Reloads the page (the offline screen is a full-page fallback). */
export function RetryButton() {
  const { t } = useLocale();
  return (
    <Button size="xl" className="w-full rounded-xl" onClick={() => window.location.reload()}>
      <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
      {t("Try again")}
    </Button>
  );
}
