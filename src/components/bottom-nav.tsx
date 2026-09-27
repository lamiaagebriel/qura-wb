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
import { href, type RouteName } from "@/lib/routes";
import { cn } from "@/lib/utils";

// Add/remove/reorder tabs here; the bar spreads them evenly.
const TABS: { route: RouteName; label: MessageKey; icon: IconSvgElement }[] = [
  { route: "home", label: "Home", icon: Home01Icon },
  { route: "search", label: "Search", icon: Search01Icon },
  { route: "profile", label: "Profile", icon: UserCircleIcon },
];

/** App-style tab bar pinned to the bottom, above the home indicator. */
export function BottomNav() {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("Main navigation")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/80 pb-(--safe-bottom) backdrop-blur-xl"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch">
        {TABS.map(({ route, label, icon }) => {
          const path = href(route);
          const active =
            path === "/" ? pathname === "/" : pathname.startsWith(path);

          return (
            <li key={route} className="flex-1">
              <Link
                href={path}
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
