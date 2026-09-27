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
import { useNavigation } from "@/components/navigation/navigation-provider";
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
 * Taps go through `selectTab`: other tab → the screen you left it on;
 * active tab → scroll to top, or back to its root from a sub-screen.
 */
export function BottomNav() {
  const { t } = useLocale();
  const pathname = usePathname();
  const { selectTab } = useNavigation();
  const activeTab = tabOf(pathname);

  return (
    <nav
      aria-label={t("Main navigation")}
      // Named so it stays still (above the sliding page) during transitions.
      style={{ viewTransitionName: "bottom-nav" }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/80 pb-(--safe-bottom) backdrop-blur-xl"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch">
        {TABS.map((tab) => {
          const { label, icon } = TAB_UI[tab];
          const active = tab === activeTab;

          return (
            <li key={tab} className="flex-1">
              <Link
                href={href(tab)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  // Keep real links (prefetch, open-in-new-tab), but route
                  // plain taps through the tab logic.
                  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                  event.preventDefault();
                  selectTab(tab);
                }}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-[color,transform] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
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
