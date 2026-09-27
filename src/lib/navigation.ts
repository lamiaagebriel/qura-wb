import { href, type RouteName } from "@/lib/routes";

/** Top-level tabs, in bottom-nav order. Each tab owns every path under it. */
export const TABS = ["home", "search", "profile"] as const satisfies RouteName[];
export type Tab = (typeof TABS)[number];

/** The tab a path belongs to, or `null` for paths outside every tab. */
export function tabOf(pathname: string): Tab | null {
  let match: Tab | null = null;
  let length = -1;
  for (const tab of TABS) {
    const root = href(tab);
    const inside =
      root === "/"
        ? pathname === "/"
        : pathname === root || pathname.startsWith(`${root}/`);
    if (inside && root.length > length) {
      match = tab;
      length = root.length;
    }
  }
  return match;
}

/** Transition types used by `<ViewTransition>` (see `components/screen.tsx`). */
export const NAV_FORWARD = "nav-forward";
export const NAV_BACK = "nav-back";
