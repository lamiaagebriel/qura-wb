"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// How far down the page has to scroll before the title collapses in
// next to the back button — small enough that it's already happened by
// the time you've scrolled past the first card or two, not a deep
// scroll-distance threshold.
const SCROLL_COLLAPSE_THRESHOLD = 24;

/**
 * Generic sticky top bar: an optional back button, a title, and an
 * optional trailing action — the same three-slot shape `PageHeader` used
 * to hardcode, but reusable anywhere (this is what `FeedHeader` grew
 * into once the home feed needed a real header instead of just a
 * logo-plus-search-link row).
 *
 * The title starts centered (the usual "large title" look) and, once
 * you've scrolled past `SCROLL_COLLAPSE_THRESHOLD`, slides over to sit
 * right next to the back button instead — the same collapse iOS nav bars
 * do, so the title stays visible and in a fixed, predictable spot while
 * you're deep in a scrolled list, rather than floating in the middle
 * ignoring an asymmetric back button/action pair.
 */
export function AppHeader({
  title,
  showBack = true,
  backHref,
  action,
  className,
}: {
  title: string | React.ReactNode;
  /** Set false for a page with nothing to go back to (the feed, as a
   * root tab) — the title then starts flush start instead of centered,
   * since there's no back button for it to collapse in next to. */
  showBack?: boolean;
  /** A real link when the "back" destination is fixed and known (so it
   * works even with no navigation history); omit to fall back to
   * `router.back()`. */
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_COLLAPSE_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const collapsed = scrolled && showBack;

  return (
    <header
      className={cn(
        "border-border/50 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-xl",
        className,
      )}
    >
      <div className="relative container flex h-12.5 items-center gap-2">
        {showBack && (
          <div className="z-10 flex w-7 shrink-0 items-center">
            {backHref ? (
              <Button asChild variant="ghost" size="icon-sm" aria-label="Back">
                <Link href={backHref}>
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    className="rtl:rotate-180"
                  />
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Back"
                onClick={() => router.back()}
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  className="rtl:rotate-180"
                />
              </Button>
            )}
          </div>
        )}

        <div
          className={cn(
            // "text-foreground absolute inset-x-4 truncate text-[15px] font-semibold transition-[inset-inline-start,inset-inline-end,text-align] duration-200 ease-out",
            "text-foreground truncate text-[15px] font-semibold duration-200 ease-out",
            showBack ? "text-center" : "text-start",
            collapsed && "inset-s-11 inset-e-11 text-start",
          )}
        >
          {typeof title === "string" ? <h1> {title}</h1> : title}
        </div>

        <div className="ms-auto flex w-7 shrink-0 items-center justify-end">
          {action}
        </div>
      </div>
    </header>
  );
}
