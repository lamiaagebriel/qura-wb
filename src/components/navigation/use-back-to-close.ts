"use client";

import { useEffect, useRef } from "react";

// A UI close's `history.back()` is async. An overlay opened from another
// (options sheet → confirm sheet) waits for it, or that late back would pop
// the new overlay's entry and close it.
let pendingBack: Promise<void> | null = null;

/** Resolves once no overlay's closing `history.back()` is in flight. */
export const overlaysSettled = () => pendingBack ?? Promise.resolve();

function back() {
  pendingBack = new Promise((resolve) =>
    window.addEventListener(
      "popstate",
      () => {
        pendingBack = null;
        resolve();
      },
      { once: true },
    ),
  );
  window.history.back();
}

/**
 * While `open`, the back gesture/button (Android back, browser back, iOS
 * swipe) closes the overlay instead of leaving the page — like a native app.
 * Opening adds a same-URL history entry; back pops it and calls `onClose`.
 * Closing any other way (tap outside, a button) removes that entry again.
 * Next's router copies its own state into the entry, so it stays happy.
 */
export function useBackToClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const pushed = useRef(false);

  useEffect(() => {
    if (!open) {
      // Closed from the UI: drop the entry we added (this pop is ignored —
      // the listener below is already gone).
      if (pushed.current) {
        pushed.current = false;
        back();
      }
      return;
    }

    let active = true;
    const onPopState = () => {
      if (!pushed.current) return;
      pushed.current = false;
      onCloseRef.current();
    };
    const start = () => {
      if (!active) return;
      window.history.pushState({ overlay: true }, "", window.location.href);
      pushed.current = true;
      window.addEventListener("popstate", onPopState);
    };
    if (pendingBack) pendingBack.then(start);
    else start();

    return () => {
      active = false;
      window.removeEventListener("popstate", onPopState);
    };
  }, [open]);
}
