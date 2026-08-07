import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The home feed's own top bar — mobile only (`sm:hidden`; `DesktopTopBar`
 * already covers the same ground, logo + a search link, at `sm` and up).
 * Matches `DesktopTopBar`/`PageHeader`'s sticky-blur chrome so it reads as
 * one consistent app shell rather than a page-specific one-off.
 *
 * The search field here isn't a real input — it's a link styled like one
 * (see `page.tsx`'s comment) — tapping anywhere in it goes straight to
 * `/search`, where the actual query box lives.
 */
export function FeedHeader({ title }: { title: string }) {
  return (
    <header className="border-border/50 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-xl sm:hidden">
      <div className="container flex h-12.5 items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="text-foreground shrink-0 text-[18px] font-bold tracking-tight"
        >
          qura<span className="text-primary">.</span>
        </Link>

        <Link
          href="/search"
          aria-label={title}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
        >
          <HugeiconsIcon icon={Search01Icon} />
        </Link>
      </div>
    </header>
  );
}
