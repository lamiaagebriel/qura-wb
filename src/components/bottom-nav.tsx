"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GridViewIcon,
  Home01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";

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
 * Styled after Instagram's floating reel tab bar: a dark, icon-only
 * capsule that stays dark regardless of the site's own light/dark theme
 * (it reads as overlay chrome, not page content), and shrinks on
 * scroll-down / grows back on scroll-up so it stays out of the way of
 * reading but is never more than one upward flick away.
 */
export function BottomNav() {
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

  const TABS: {
    href: string;
    label: string;
    icon: typeof Home01Icon;
    exact?: boolean;
  }[] = [
    { href: "/", label: t("Home"), icon: Home01Icon, exact: true },
    { href: "/categories", label: t("Categories & News"), icon: GridViewIcon },
    { href: "/account", label: t("Profile"), icon: UserCircleIcon },
  ];

  return (
    <nav
      className={cn(
        "bg-card/85 fixed inset-x-6 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 origin-bottom rounded-full shadow-xl backdrop-blur-xl transition-transform duration-300 ease-out md:hidden",
        shrunk ? "scale-90" : "scale-100",
      )}
    >
      <div className="flex items-center justify-between px-2 py-2">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className="flex flex-1 items-center justify-center py-1"
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-full p-2.5 transition-colors",
                  active ? "text-primary bg-white/15" : "text-foreground/60",
                )}
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  strokeWidth={active ? 2.5 : 1.8}
                  className="size-6"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
