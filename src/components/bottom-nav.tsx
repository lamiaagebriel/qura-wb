"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  GridViewIcon,
  Home01Icon,
  Search01Icon,
  User,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewThreadButton } from "@/components/new-thread-composer";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

// Ignore sub-pixel/momentum jitter — only a deliberate scroll flips state.
const SCROLL_DELTA_THRESHOLD = 12;
// Always full-size this close to the top, regardless of scroll direction.
const SCROLL_TOP_GUARD = 48;

/**
 * Fixed app-style tab bar, mobile only (`sm:hidden`) — the app-shell feel
 * this UI is going for only makes sense at phone width; `DesktopTopBar`
 * covers the same destinations at `sm` and up.
 *
 * Styled after Instagram's floating reel tab bar: frosted glass that stays
 * glassy regardless of the site's own light/dark theme (it reads as
 * overlay chrome, not page content), and shrinks on scroll-down / grows
 * back on scroll-up so it stays out of the way of reading but is never
 * more than one upward flick away.
 *
 * The bar spans the full width (inset a bit from each screen edge, see
 * `inset-x-4` below — that's the "space at the end"), and every slot
 * inside it — real tabs and the "+" action alike — gets an equal
 * `flex-1` share of whatever's left, rather than being sized to its own
 * content. Add or remove a `TABS` entry and the row just redistributes;
 * nothing here is tuned to a fixed count.
 */
export function BottomNav({
  user,
  businesses,
  activeIdentity,
}: {
  user?: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  } | null;
  businesses?: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  }[];
  // The Profile tab's avatar follows whichever identity is active — a
  // business's initials/photo there, not yours, is the whole point of
  // "the app feels switched". `NewThreadButton` gets it too, so a new
  // top-level thread defaults to posting as it.
  activeIdentity?: {
    id: string;
    name: string;
    image: string | null;
    isBusiness: boolean;
  } | null;
}) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [shrunk, setShrunk] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let ticking = false;

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const delta = scrollY - lastScrollY.current;

        if (scrollY < SCROLL_TOP_GUARD) {
          setShrunk(false);
          lastScrollY.current = scrollY;
        } else if (delta > SCROLL_DELTA_THRESHOLD) {
          setShrunk(true);
          lastScrollY.current = scrollY;
        } else if (delta < -SCROLL_DELTA_THRESHOLD) {
          setShrunk(false);
          lastScrollY.current = scrollY;
        }

        ticking = false;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add/remove/reorder freely — each entry is just another `flex-1` slot
  // in the row. `action: "compose"` marks the one non-destination entry
  // (the "+"); everything else is a plain `href`.
  const TABS: {
    href: string;
    label: string;
    icon: typeof Home01Icon;
    exact?: boolean;
    action?: "compose";
  }[] = [
    { href: "/", label: t("Feed"), icon: Home01Icon, exact: true },
    { href: "/search", label: t("Search"), icon: Search01Icon },
    {
      href: "/create-thread",
      label: t("New thread"),
      icon: Add01Icon,
      action: "compose",
    },
    { href: "/categories", label: t("Categories"), icon: GridViewIcon },
    { href: "/account", label: t("Profile"), icon: UserCircleIcon },
  ];

  const activeIndex = TABS.findIndex((tab) =>
    tab.action
      ? false
      : tab.exact
        ? pathname === tab.href
        : pathname.startsWith(tab.href),
  );

  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Measures the active tab's actual rendered box (not a guessed 1/N
  // split) so the indicator lands correctly regardless of writing
  // direction (`offsetLeft` is relative to the row's own layout either
  // way), unequal tab widths, or however many `TABS` there are right
  // now. `useLayoutEffect` so it's positioned before paint — no frame of
  // it sitting in the wrong spot first.
  useLayoutEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (!el) {
      setIndicator(null);
      return;
    }
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIndex]);

  return (
    <nav
      className={cn(
        // Full width, inset from each screen edge rather than sized to
        // its own content — `TABS` can grow or shrink and the bar just
        // keeps spanning the same space.
        "fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 origin-bottom rounded-full transition-transform duration-300 ease-out md:hidden",
        // Frosted glass, always — this is overlay chrome sitting on top of
        // whatever's behind it (a photo, the feed, ...), not page content,
        // so it doesn't switch with the site's own light/dark theme the
        // way the rest of the UI does. Kept deliberately light on both
        // fill opacity *and* blur radius — a heavy blur reads as opaque
        // frosted plastic, not glass; what you actually see through
        // is a faint tint plus a lightly softened backdrop, with the
        // inset highlight along the top edge doing the work of reading
        // as "glass" rather than just "translucent".
        "bg-background/25 border-border/40 border shadow-[0_8px_32px_rgba(var(--foreground),0.14)] backdrop-blur-xs backdrop-saturate-150",
        shrunk ? "scale-90" : "scale-100",
      )}
    >
      <div className="relative flex items-center px-1.5 py-1">
        {indicator && (
          <span
            aria-hidden
            className="bg-foreground/20 absolute top-1/2 left-0 h-11 rounded-full shadow-[0_1px_4px_rgba(var(--foreground),0.08)] transition-[transform,width] duration-300 ease-out"
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px) translateY(-50%)`,
            }}
          />
        )}

        {TABS.map((tab, index) => {
          const active = index === activeIndex;

          if (tab.action === "compose") {
            return (
              <div
                key={index}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                className="relative z-10 flex flex-1 items-center justify-center py-1"
              >
                <NewThreadButton
                  user={user}
                  businesses={businesses}
                  defaultPostAsId={
                    activeIdentity?.isBusiness ? activeIdentity.id : undefined
                  }
                />
              </div>
            );
          }

          return (
            <Link
              key={index}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              href={tab.href}
              aria-label={tab.label}
              className="relative z-10 flex flex-1 items-center justify-center py-1"
            >
              <span className="flex items-center justify-center rounded-full p-2 text-neutral-900">
                {tab.href === "/account" && (activeIdentity ?? user) ? (
                  <Avatar>
                    {(activeIdentity ?? user)!.image && (
                      <AvatarImage
                        src={(activeIdentity ?? user)!.image!}
                        alt={(activeIdentity ?? user)!.name}
                      />
                    )}
                    <AvatarFallback
                      className={cn(
                        "text-muted-foreground/25",
                        active && "text-neutral-900",
                      )}
                    >
                      <HugeiconsIcon icon={User} strokeWidth={1.8} />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <HugeiconsIcon
                    icon={tab.icon}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={cn(
                      "text-muted-foreground/50 size-6",
                      active && "text-foreground",
                    )}
                  />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
