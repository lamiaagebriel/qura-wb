"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  use,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";

import { useLocale } from "@/lib/i18n/provider";
import { navType, TABS, tabOf, type NavType, type Tab } from "@/lib/navigation";
import { href } from "@/lib/routes";

/** Everything a `<Link>` needs to perform one app navigation. */
export type NavLink = {
  href: string;
  replace?: boolean;
  transitionTypes?: NavType[];
  /** Call from the link's onClick (bookkeeping; may cancel the click). */
  onClick: (event: MouseEvent) => void;
};

type NavigationContextValue = {
  /** Back one screen *within the current tab*; with nothing to go back to
   * in this tab (deep link, fresh open) → `fallback`, the parent. */
  backLink: (fallback: string) => NavLink;
  /** Bottom-nav tab: another tab → the screen you left it on (scroll
   * restored); the active tab → scroll to top, or its root from deeper. */
  tabLink: (tab: Tab) => NavLink;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const scrollTop = () =>
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });

// Modified clicks (open in new tab…) are left to the browser.
const isPlainClick = (event: MouseEvent) =>
  !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

/**
 * Native-app navigation on top of the Next router:
 * - every tab has its own back stack, so the in-app back arrow returns to
 *   the previous screen of *this* tab (not whatever tab you visited last),
 *   and switching tabs returns to where you left each one;
 * - every screen's scroll position is restored when you come back to it;
 *   new screens open at the top.
 *
 * It only *describes* navigations (`backLink`, `tabLink`); they're performed
 * by real `<Link>`s. Links prefetch their target and carry transition types
 * reliably — `router.push(…, { transitionTypes })` loses the type when the
 * screen has to be fetched, so the slide wouldn't play.
 * The browser/OS back button still follows the browser's own history.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { dir } = useLocale();

  const stacks = useRef<Record<Tab, string[]>>(
    Object.fromEntries(TABS.map((tab) => [tab, []])) as unknown as Record<
      Tab,
      string[]
    >,
  );
  const scrollByPath = useRef(new Map<string, number>());
  const currentPath = useRef(pathname);
  // While a navigation is in flight, ignore scroll events (the router's own
  // scroll-to-top would otherwise overwrite the screen we're leaving).
  const navigating = useRef(false);
  const restoreNext = useRef(false);

  /** A tab's stack including the current screen (the effect below records
   * it after render, but links are computed during render). */
  const stackOf = (tab: Tab) => {
    const stack = [...stacks.current[tab]];
    if (tabOf(pathname) !== tab || stack.at(-1) === pathname) return stack;
    if (stack.at(-2) === pathname) stack.pop();
    else stack.push(pathname);
    return stack;
  };

  // Remember the scroll position of the current screen.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (navigating.current || frame) return;
      frame = requestAnimationFrame(() => {
        scrollByPath.current.set(currentPath.current, window.scrollY);
        frame = 0;
      });
    };
    // Browser/OS back & forward: restore the destination's scroll too.
    const onPopState = () => {
      navigating.current = true;
      restoreNext.current = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onPopState);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Record every screen change in its tab's stack; restore scroll.
  useEffect(() => {
    const tab = tabOf(pathname);
    if (tab) stacks.current[tab] = stackOf(tab);
    currentPath.current = pathname;

    if (restoreNext.current) {
      const y = scrollByPath.current.get(pathname) ?? 0;
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
    restoreNext.current = false;
    requestAnimationFrame(() => {
      navigating.current = false;
    });
    // stackOf only reads refs + pathname.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /** Save this screen's scroll; restore the next one's. */
  const beginNavigation = () => {
    scrollByPath.current.set(currentPath.current, window.scrollY);
    navigating.current = true;
    restoreNext.current = true;
  };

  const back = [navType("back", dir)];

  const value: NavigationContextValue = {
    backLink(fallback) {
      const tab = tabOf(pathname);
      const stack = tab ? stackOf(tab) : [];
      const previous = stack.at(-2);
      return {
        // Opened directly on this screen → replace it with its parent, so
        // back doesn't leave the app (and history stays clean).
        href: previous ?? fallback,
        replace: !previous,
        transitionTypes: back,
        onClick(event) {
          if (!isPlainClick(event)) return;
          if (tab) stacks.current[tab] = previous ? stack.slice(0, -1) : [fallback];
          beginNavigation();
        },
      };
    },

    tabLink(tab) {
      const root = href(tab);
      if (tabOf(pathname) !== tab) {
        // Another tab: instant switch to where you left it.
        return {
          href: stackOf(tab).at(-1) ?? root,
          onClick(event) {
            if (isPlainClick(event)) beginNavigation();
          },
        };
      }
      if (pathname === root) {
        // Already on the tab's root: scroll to top instead of navigating.
        return {
          href: root,
          onClick(event) {
            if (!isPlainClick(event)) return;
            event.preventDefault();
            scrollTop();
          },
        };
      }
      // Deeper in the active tab → back to its root.
      return {
        href: root,
        transitionTypes: back,
        onClick(event) {
          if (!isPlainClick(event)) return;
          stacks.current[tab] = [root];
          beginNavigation();
        },
      };
    },
  };

  return <NavigationContext value={value}>{children}</NavigationContext>;
}

export function useNavigation() {
  const ctx = use(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used inside <NavigationProvider>");
  return ctx;
}
