"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  use,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { useLocale } from "@/lib/i18n/provider";
import { navType, TABS, tabOf, type Tab } from "@/lib/navigation";
import { href } from "@/lib/routes";

type NavigationContextValue = {
  /** Back one screen *within the current tab*; with nothing to go back to
   * in this tab (deep link, fresh open) go to `fallback`, the parent. */
  goBack: (fallback: string) => void;
  /** Bottom-nav tap: another tab → the screen you left it on (scroll
   * restored); the active tab → scroll to top, or its root from deeper. */
  selectTab: (tab: Tab) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const scrollTop = () =>
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });

/**
 * Native-app navigation on top of the Next router:
 * - every tab has its own back stack, so the in-app back arrow returns to
 *   the previous screen of *this* tab (not whatever tab you visited last),
 *   and switching tabs returns to where you left each one;
 * - every screen's scroll position is restored when you come back to it;
 *   new screens open at the top.
 * The browser/OS back button still follows the browser's own history.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
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

  // Keep the current tab's stack in sync with every screen change.
  // (`goBack`/`selectTab` update the stack before navigating, so here the
  // top already matches and nothing changes.)
  useEffect(() => {
    const tab = tabOf(pathname);
    if (tab) {
      const stack = stacks.current[tab];
      if (stack.at(-1) === pathname) {
        // Already on top.
      } else if (stack.at(-2) === pathname) {
        stack.pop(); // browser back within the tab
      } else {
        stack.push(pathname);
      }
    }
    currentPath.current = pathname;

    if (restoreNext.current) {
      const y = scrollByPath.current.get(pathname) ?? 0;
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
    restoreNext.current = false;
    requestAnimationFrame(() => {
      navigating.current = false;
    });
  }, [pathname]);

  const beginNavigation = () => {
    scrollByPath.current.set(currentPath.current, window.scrollY);
    navigating.current = true;
    restoreNext.current = true;
  };

  /** Navigate back with the backward slide. */
  const pushBack = (path: string, replace = false) => {
    beginNavigation();
    // The router carries `transitionTypes` through the whole (async)
    // navigation; tagging a surrounding startTransition instead loses the
    // type when the screen has to be fetched first.
    const options = {
      scroll: false,
      transitionTypes: [navType("back", dir)],
    };
    if (replace) router.replace(path, options);
    else router.push(path, options);
  };

  const value: NavigationContextValue = {
    goBack(fallback) {
      const tab = tabOf(pathname);
      const stack = tab ? stacks.current[tab] : [];
      if (stack.length > 1) {
        stack.pop();
        pushBack(stack.at(-1)!);
        return;
      }
      // Opened directly on this screen: replace it with its parent so back
      // doesn't leave the app (and history stays clean).
      if (tab) stacks.current[tab] = [fallback];
      pushBack(fallback, true);
    },

    selectTab(tab) {
      const root = href(tab);
      const stack = stacks.current[tab];

      if (tabOf(pathname) !== tab) {
        // Another tab: instant switch to where you left it.
        beginNavigation();
        router.push(stack.at(-1) ?? root, { scroll: false });
        return;
      }
      if (pathname === root) {
        scrollTop();
        return;
      }
      // Deeper in the active tab → back to its root.
      stacks.current[tab] = [root];
      pushBack(root);
    },
  };

  return <NavigationContext value={value}>{children}</NavigationContext>;
}

export function useNavigation() {
  const ctx = use(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used inside <NavigationProvider>");
  return ctx;
}
