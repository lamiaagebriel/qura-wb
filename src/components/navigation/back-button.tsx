"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";

import { ArrowLeft01Icon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";
import { navType, swipeNavType } from "@/lib/navigation";

import { canGoBack, markReplace } from "./history";
import { useSwipeBack } from "./use-swipe-back";

/**
 * In-app back arrow (mirrored in RTL). With an in-app screen behind this
 * one it's the browser's back (`router.back()`, instant). Opened directly
 * (deep link) it replaces this screen with `fallback`, the parent, sliding
 * back — so back never leaves the app. In the installed app, an edge swipe
 * goes back too (use-swipe-back).
 */
export function BackButton({ fallback }: { fallback: string }) {
  const { t, dir } = useLocale();
  const router = useRouter();
  const swipeRef = useRef<HTMLAnchorElement>(null);
  useSwipeBack(swipeRef, dir);

  const onClick = (event: MouseEvent) => {
    // Modified clicks (open in new tab…) are left to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!canGoBack()) return markReplace(); // the link goes to `fallback`
    event.preventDefault();
    router.back();
  };

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
            href={fallback}
            // Full prefetch: the screens are dynamic, and without their data
            // ready the router commits twice — the back slide would animate
            // the current screen, then the parent pops in.
            prefetch
            replace
            transitionTypes={[navType("back", dir)]}
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
        href={fallback}
        replace
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
