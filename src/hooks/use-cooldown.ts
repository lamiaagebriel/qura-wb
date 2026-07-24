"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Small countdown timer used to throttle "resend email" style actions.
 * Purely client-side for now — wire `start()` up to the real server
 * action once the backend endpoint exists.
 */
export function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds]);

  return { remaining, isActive: remaining > 0, start };
}
