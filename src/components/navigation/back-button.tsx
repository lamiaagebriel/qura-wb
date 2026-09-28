"use client";

import Link from "next/link";
import { useRef } from "react";

import { ArrowLeft01Icon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";
import { swipeNavType } from "@/lib/navigation";

import { useNavigation } from "./navigation-provider";
import { useSwipeBack } from "./use-swipe-back";

/**
 * In-app back arrow (mirrored in RTL): a real link to the previous screen
 * of this tab, sliding back; with no in-app history (deep link) it goes to
 * `fallback`, the parent. Being a `<Link>`, its target is prefetched and the
 * back slide always plays. In the installed app, an edge swipe goes back
 * too (same link, finishing the slide from the finger — use-swipe-back).
 */
export function BackButton({ fallback }: { fallback: string }) {
  const { t, dir } = useLocale();
  const swipeRef = useRef<HTMLAnchorElement>(null);
  useSwipeBack(swipeRef, dir);
  const { backLink } = useNavigation();
  const { href, replace, transitionTypes, onClick } = backLink(fallback);

  return (
    <>
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
      {/* The edge swipe clicks this: same target, its own transition type. */}
      <Link
        ref={swipeRef}
        href={href}
        replace={replace}
        scroll={false}
        prefetch
        transitionTypes={[swipeNavType(dir)]}
        onClick={onClick}
        hidden
        aria-hidden
        tabIndex={-1}
      />
    </>
  );
}
