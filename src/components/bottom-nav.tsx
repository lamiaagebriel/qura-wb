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
import { cn } from "@/lib/utils";

// Tabs and their order live in `lib/navigation.ts`; this adds the UI bits.
const TAB_UI: Record<Tab, { label: MessageKey; icon: IconSvgElement }> = {
  home: { label: "Home", icon: Home01Icon },
  search: { label: "Search", icon: Search01Icon },
  profile: { label: "Profile", icon: UserCircleIcon },
};

/**
 * App-style tab bar pinned to the bottom, above the home indicator.
 * Each tab is a real link from `tabLink`: other tab → the screen you left
 * it on; active tab → scroll to top, or back to its root from a sub-screen.
 */
export function BottomNav() {
  const { t } = useLocale();
  const pathname = usePathname();
  const { tabLink } = useNavigation();
  const activeTab = tabOf(pathname);

  return (
    <nav
      aria-label={t("Main navigation")}
      // Named so it stays still (above the sliding page) during transitions.
      // Slides away while the on-screen keyboard is up (components/keyboard).
      style={{ viewTransitionName: "bottom-nav" }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/80 pb-(--safe-bottom) backdrop-blur-xl transition-[translate,visibility] duration-200 ease-out in-data-[keyboard=open]:invisible in-data-[keyboard=open]:translate-y-full motion-reduce:transition-none"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch">
        {TABS.map((tab) => {
          const { label, icon } = TAB_UI[tab];
          const active = tab === activeTab;
          const link = tabLink(tab);

          return (
            <li key={tab} className="flex-1">
              <Link
                href={link.href}
                // Full prefetch: tab screens open instantly, data included.
                prefetch
                scroll={false}
                transitionTypes={link.transitionTypes}
                onClick={link.onClick}
                aria-current={active ? "page" : undefined}
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
