"use client";

import Link from "next/link";

import { ArrowLeft01Icon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

import { useNavigation } from "./navigation-provider";

/**
 * In-app back arrow (mirrored in RTL): a real link to the previous screen
 * of this tab, sliding back; with no in-app history (deep link) it goes to
 * `fallback`, the parent. Being a `<Link>`, its target is prefetched and the
 * back slide always plays.
 */
export function BackButton({ fallback }: { fallback: string }) {
  const { t } = useLocale();
  const { backLink } = useNavigation();
  const { href, replace, transitionTypes, onClick } = backLink(fallback);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 rounded-full"
      aria-label={t("Back")}
      nativeButton={false}
      render={
        <Link
          href={href}
          // Full prefetch: the screens are dynamic, and without their data
          // ready the router commits twice — the back slide would animate
          // the current screen, then the previous one pops in.
          prefetch
          replace={replace}
          scroll={false}
          transitionTypes={transitionTypes}
          onClick={onClick}
        />
      }
    >
      <HugeiconsIcon
        icon={ArrowLeft01Icon}
        strokeWidth={2}
        className="size-6 rtl:rotate-180"
      />
    </Button>
  );
}
