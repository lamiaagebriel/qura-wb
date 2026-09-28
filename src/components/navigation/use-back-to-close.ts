"use client";

import { useEffect, useRef } from "react";

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
        window.history.back();
      }
      return;
    }

    window.history.pushState({ overlay: true }, "", window.location.href);
    pushed.current = true;

    const onPopState = () => {
      if (!pushed.current) return;
      pushed.current = false;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open]);
}
