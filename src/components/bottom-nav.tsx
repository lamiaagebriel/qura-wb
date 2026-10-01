"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home01Icon,
  HugeiconsIcon,
  Search01Icon,
  UserCircleIcon,
  type IconSvgElement,
} from "@/components/icons";
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

/**
 * App-style tab bar pinned to the bottom, above the home indicator.
 * Each tab links to its root screen (instant, no slide).
 */
export function BottomNav() {
  const { t } = useLocale();
  const activeTab = tabOf(usePathname());

  return (
    <nav
      aria-label={t("Main navigation")}
      // Named so it stays still (above the sliding page) during transitions.
      // Slides away while the on-screen keyboard is up (components/keyboard).
      style={{ viewTransitionName: "bottom-nav" }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/80 pb-(--safe-bottom) backdrop-blur-xs transition-[translate,visibility] duration-200 ease-out in-data-[keyboard=open]:invisible in-data-[keyboard=open]:translate-y-full motion-reduce:transition-none"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch">
        {TABS.map((tab) => {
          const { label, icon } = TAB_UI[tab];
          const active = tab === activeTab;

          return (
            <li key={tab} className="flex-1">
              <Link
                href={href(tab)}
                // Full prefetch: tab screens open instantly, data included.
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-[color,transform] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                  active && "text-foreground",
                )}
              >
                <HugeiconsIcon
                  icon={icon}
                  strokeWidth={active ? 2.25 : 1.75}
                  className="size-6"
                />
                {t(label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
