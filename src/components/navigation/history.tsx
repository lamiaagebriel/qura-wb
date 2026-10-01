"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// How many in-app screens are behind this one in the browser history
// (0 = a deep link or a fresh open: going back would leave the app).
// A push adds one; a back/forward removes one — counting a forward as a
// back only errs toward the safe side (the parent instead of history).
let depth = 0;
let popped = false;
let replacing = false;

/** Whether `router.back()` stays inside the app. */
export const canGoBack = () => depth > 0;

/** Call right before a `replace` navigation, so it isn't counted. */
export const markReplace = () => {
  replacing = true;
};

/** Counts screen changes (mounted once, in `Providers`). Renders nothing. */
export function HistoryTracker() {
  const pathname = usePathname();
  const last = useRef(pathname);

  useEffect(() => {
    // A popstate on the same path (back closing a sheet) isn't a screen change.
    const onPopState = () => {
      if (window.location.pathname !== last.current) popped = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (pathname === last.current) return;
    last.current = pathname;
    if (popped) depth = Math.max(0, depth - 1);
    else if (!replacing) depth++;
    popped = replacing = false;
  }, [pathname]);

  return null;
}
