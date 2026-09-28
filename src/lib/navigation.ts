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

/**
 * Transition types used by `<ViewTransition>` (see `navigation/screen.tsx`).
 * RTL gets its own types (mirrored slides) instead of CSS `[dir]` overrides,
 * which iOS Safari applies inconsistently to view-transition layers.
 */
export const NAV_TYPES = [
  "nav-forward",
  "nav-back",
  "nav-forward-rtl",
  "nav-back-rtl",
  // Edge-swipe back: finishes from where the finger let go (see
  // navigation/use-swipe-back.ts, which writes its keyframes).
  "nav-swipe",
  "nav-swipe-rtl",
] as const;
export type NavType = (typeof NAV_TYPES)[number];

export function navType(
  direction: "forward" | "back",
  dir: "ltr" | "rtl",
): NavType {
  return `nav-${direction}${dir === "rtl" ? "-rtl" : ""}`;
}

export function swipeNavType(dir: "ltr" | "rtl"): NavType {
  return dir === "rtl" ? "nav-swipe-rtl" : "nav-swipe";
}
