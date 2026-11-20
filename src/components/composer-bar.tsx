"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A message bar pinned to the bottom of a comment-like screen (reviews,
 * replies), like Instagram's or WhatsApp's: clear of the home indicator (no
 * tab bar on these screens), and on the keyboard while it's up. A spacer
 * before it keeps the last item clear of it, however tall it grows.
 */
export function ComposerBar({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);
  useBarHeight(bar);
  return (
    <>
      <div aria-hidden className="h-[var(--composer-bar,calc(6rem+var(--safe-bottom)))] shrink-0" />
      <div
        ref={bar}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-background/95 pb-(--safe-bottom) backdrop-blur-xs in-data-[keyboard=open]:bottom-(--keyboard-inset) in-data-[keyboard=open]:pb-0"
      >
        <div className="mx-auto max-w-md px-3 py-2">{children}</div>
      </div>
    </>
  );
}

/** The bar for someone signed out: looks like the field, opens the sign-in sheet. */
export function SignedOutBar({ icon, label }: { icon: IconSvgElement; label: string }) {
  const { open: signIn } = useAuthSheet();
  return (
    <button
      type="button"
      onClick={() => signIn()}
      className={cn(
        buttonVariants({ variant: "secondary" }),
        "h-11 w-full justify-start gap-2 rounded-3xl bg-muted px-4 text-start font-normal text-muted-foreground ring-1 ring-foreground/5",
      )}
    >
      <HugeiconsIcon icon={icon} />
      {label}
    </button>
  );
}

/**
 * Publishes the bar's real height (it grows with the text and the
 * "Editing" row) as `--composer-bar`, for the spacer, and lifts toasts
 * above it (`--toast-bottom`, read by the toast viewport).
 */
function useBarHeight(bar: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const root = document.documentElement.style;
    const observer = new ResizeObserver(() => {
      const height = el.offsetHeight;
      root.setProperty("--composer-bar", `${height}px`);
      root.setProperty("--toast-bottom", `calc(${height + 12}px + var(--keyboard-inset, 0px))`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.removeProperty("--composer-bar");
      root.removeProperty("--toast-bottom");
    };
  }, [bar]);
}
