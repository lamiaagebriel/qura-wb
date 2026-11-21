"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import {
  DiscountTag01Icon,
  Home01Icon,
  HugeiconsIcon,
  ICON_STROKE,
  PlusSignIcon,
  Search01Icon,
  UserCircleIcon,
  type IconSvgElement,
} from "@/components/icons";
import {
  Highlight,
  HighlightItem,
} from "@/components/animate-ui/primitives/effects/highlight";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { StackLink } from "@/components/navigation/stack-link";
import type { MessageKey } from "@/lib/i18n/types";
import { useLocale } from "@/lib/i18n/provider";
import { TABS, tabOf, type Tab } from "@/lib/navigation";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

// Tabs and their order live in `lib/navigation.ts`; this adds the UI bits.
const TAB_UI: Record<Tab, { label: MessageKey; icon: IconSvgElement }> = {
  home: { label: "Home", icon: Home01Icon },
  search: { label: "Search", icon: Search01Icon },
  profile: { label: "Profile", icon: UserCircleIcon },
};

// The highlighted centre button: filled, raised above the bar.
const FROSTED =
  "rounded-full border border-border/40 bg-background/90 shadow-lg shadow-foreground/10 backdrop-blur-xs backdrop-saturate-150";
const NEW_POST = cn(
  buttonVariants({ variant: "ghost" }),
  FROSTED,
  "size-14 shrink-0 text-foreground hover:bg-background/90 active:scale-90",
);

// Ignore small or momentum jitter: only a deliberate scroll flips the size.
const SCROLL_DELTA = 12;
// Always full size this close to the top.
const TOP_GUARD = 48;

/**
 * The tab bar, like Instagram's: a floating frosted pill above the home
 * indicator, icons only (the label is the link's name), with a highlight
 * that slides to the open tab. It shrinks while you scroll down and grows
 * back on the way up. Profile shows your photo once you're signed in. Each
 * tab links to its root screen (instant, no slide). The room it takes is
 * `--tab-bar` (globals.css).
 */
export function BottomNav({
  user,
}: {
  user?: { name: string; image: string | null } | null;
}) {
  const { t } = useLocale();
  const activeTab = tabOf(usePathname());
  const shrunk = useShrinkOnScroll();
  const { open: signIn } = useAuthSheet();

  return (
    <nav
      aria-label={t("Main navigation")}
      // Named so it stays still (above the sliding page) during transitions.
      // Slides away while the on-screen keyboard is up (components/keyboard).
      style={{ viewTransitionName: "bottom-nav" }}
      className={cn(
        "fixed inset-x-4 bottom-[calc(var(--safe-bottom)+0.75rem)] z-40 mx-auto flex max-w-xs origin-bottom items-center gap-2",
        "transition-[scale,translate,visibility] duration-300 ease-out motion-reduce:transition-none",
        "in-data-[keyboard=open]:invisible in-data-[keyboard=open]:translate-y-[calc(100%+var(--safe-bottom)+1rem)]",
        shrunk && "scale-90",
      )}
    >
      <ul className={cn(FROSTED, "relative flex flex-1 items-center p-1")}>
        {/* The open tab's highlight springs from tab to tab (animate-ui Highlight). */}
        <Highlight
          controlledItems
          value={activeTab}
          // The route picks the tab, not the tap.
          click={false}
          className="inset-0 rounded-full bg-foreground/10"
        >
          {TABS.map(renderTab)}
        </Highlight>
      </ul>
      {/* New post: its own frosted circle beside the bar. Signed out, it opens sign-in. */}
      {user ? (
        <StackLink
          href={href("newPost")}
          aria-label={t("New post")}
          className={NEW_POST}
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-6" />
        </StackLink>
      ) : (
        <button
          type="button"
          aria-label={t("New post")}
          onClick={() => signIn()}
          className={NEW_POST}
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-6" />
        </button>
      )}
    </nav>
  );

  function renderTab(tab: Tab) {
    const { label, icon } = TAB_UI[tab];
    const active = tab === activeTab;
    return (
      <HighlightItem key={tab} as="li" value={tab} className="flex-1">
        <Link
          href={href(tab)}
          // Full prefetch: tab screens open instantly, data included.
          prefetch
          aria-label={t(label)}
          aria-current={active ? "page" : undefined}
          // A tap or click doesn't leave the tab focused (no ring around
          // the highlight); keyboard focus (Enter: detail 0) keeps it.
          onClick={(event) => event.detail > 0 && event.currentTarget.blur()}
          className={cn(
            // The button style: no outline on a tap, a ring only for keyboard focus.
            buttonVariants({ variant: "ghost" }),
            "flex h-12 w-full rounded-full text-muted-foreground transition-[color,scale] hover:bg-transparent active:scale-90 motion-reduce:transition-none",
            active && "text-foreground",
          )}
        >
          {tab === "profile" && user ? (
            <Avatar
              className={cn("size-7", active && "ring-[1.5px] ring-foreground")}
            >
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback>{user.name}</AvatarFallback>
            </Avatar>
          ) : (
            <HugeiconsIcon
              icon={icon}
              // Bolder when active, around the app's stroke.
              strokeWidth={ICON_STROKE + (active ? 0.25 : -0.25)}
              className="size-6"
            />
          )}
        </Link>
      </HighlightItem>
    );
  }
}

/** True while the page is being scrolled down (past the top), false on the way up. */
function useShrinkOnScroll() {
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (y < TOP_GUARD) {
          setShrunk(false);
          last = y;
        } else if (Math.abs(delta) > SCROLL_DELTA) {
          setShrunk(delta > 0);
          last = y;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return shrunk;
}
