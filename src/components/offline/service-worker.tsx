"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (public/sw.js) in production. In
 * development it removes any worker left over from a production build on
 * the same address, so it can't serve stale pages to the dev server.
 * (NODE_ENV is inlined by Next at build time — safe to read on the client.)
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => r.unregister()));
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {}); // unsupported (e.g. http LAN address) — app still works
  }, []);
  return null;
}

/** Forget pages the worker saved (e.g. on sign out, for privacy). */
export function clearSavedPages() {
  navigator.serviceWorker?.controller?.postMessage({ type: "clear-pages" });
}
