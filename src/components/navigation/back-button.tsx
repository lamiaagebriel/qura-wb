"use client";

import { ArrowLeft01Icon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

import { useNavigation } from "./navigation-provider";

/**
 * In-app back arrow (mirrored in RTL). Goes back in history with a slide;
 * with no in-app history (deep link) it goes to `fallback`, the parent.
 */
export function BackButton({ fallback }: { fallback: string }) {
  const { t } = useLocale();
  const { goBack } = useNavigation();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 rounded-full"
      aria-label={t("Back")}
      onClick={() => goBack(fallback)}
    >
      <HugeiconsIcon
        icon={ArrowLeft01Icon}
        strokeWidth={2}
        className="size-6 rtl:rotate-180"
      />
    </Button>
  );
}
