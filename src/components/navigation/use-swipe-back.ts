"use client";

import { useEffect, type RefObject } from "react";

import { isStandalone } from "@/lib/device";

const EDGE = 24; // px from the leading edge where a back swipe can start
const INTENT = 10; // px moved before deciding: horizontal swipe or scroll
const COMMIT = 0.35; // share of the width past which letting go goes back
const FLICK = 0.4; // px/ms: a quick flick goes back from anywhere
const STYLE_ID = "nav-swipe-style";

/**
 * iOS-style edge swipe to go back, for the installed app (a browser tab has
 * its own edge swipe; Android has the system back gesture). The screen
 * follows the finger; letting go past `COMMIT` (or flicking) clicks `link`
 * — the back link, carrying the `nav-swipe*` transition type — and the
 * slide finishes from where the finger left it. Otherwise it springs back.
 *
 * The keyframes are written per swipe with literal pixel values: iOS Safari
 * mishandles var() math on view-transition layers (see globals.css).
 */
export function useSwipeBack(
  linkRef: RefObject<HTMLAnchorElement | null>,
  dir: "ltr" | "rtl",
) {
  useEffect(() => {
    const link = linkRef.current;
    const screen = link?.closest<HTMLElement>("[data-screen]");
    if (!link || !screen) return;

    const sign = dir === "rtl" ? -1 : 1; // finger direction for "back"
    let start: { x: number; y: number } | null = null;
    let dragging = false;
    let offset = 0;
    let samples: { x: number; t: number }[] = [];

    const reset = () => {
      screen.style.removeProperty("transform");
      screen.style.removeProperty("transition");
      screen.style.removeProperty("box-shadow");
      screen.style.removeProperty("will-change");
    };

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !isStandalone()) return;
      // Only this screen (not an open sheet, not a screen sliding away).
      if (!(event.target instanceof Node) || !screen.contains(event.target)) return;
      const touch = event.touches[0];
      const fromEdge =
        sign === 1 ? touch.clientX : window.innerWidth - touch.clientX;
      if (fromEdge > EDGE) return;
      start = { x: touch.clientX, y: touch.clientY };
      dragging = false;
      offset = 0;
      samples = [{ x: touch.clientX, t: event.timeStamp }];
    };

    const onMove = (event: TouchEvent) => {
      if (!start) return;
      const touch = event.touches[0];
      const moved = (touch.clientX - start.x) * sign;
      if (!dragging) {
        const dy = Math.abs(touch.clientY - start.y);
        if (Math.max(Math.abs(moved), dy) < INTENT) return;
        if (moved <= dy) {
          start = null; // a scroll (or the wrong way): leave it alone
          return;
        }
        dragging = true;
        screen.style.transition = "none";
        screen.style.willChange = "transform";
        screen.style.boxShadow = `${-sign * 8}px 0 24px rgb(0 0 0 / 0.15)`;
      }
      event.preventDefault(); // no scrolling while dragging
      offset = Math.max(0, moved);
      screen.style.transform = `translateX(${offset * sign}px)`;
      samples.push({ x: touch.clientX, t: event.timeStamp });
      if (samples.length > 6) samples.shift();
    };

    const onEnd = () => {
      if (!start) return;
      start = null;
      if (!dragging) return;
      dragging = false;

      const first = samples[0];
      const last = samples.at(-1)!;
      const velocity =
        last.t > first.t ? ((last.x - first.x) * sign) / (last.t - first.t) : 0;
      const width = screen.offsetWidth;

      if (offset > width * COMMIT || (velocity > FLICK && offset > 20)) {
        finish(offset, width);
      } else {
        screen.style.transition = "transform 200ms var(--nav-ease)";
        screen.style.transform = "";
        screen.addEventListener("transitionend", reset, { once: true });
      }
    };

    const onCancel = () => {
      if (dragging) reset();
      start = null;
      dragging = false;
    };

    /** Go back, continuing the slide from `offset`. */
    const finish = (offset: number, width: number) => {
      const x = offset * sign;
      const ms = Math.round(Math.max(120, 280 * (1 - offset / width)));
      const cls = dir === "rtl" ? "nav-swipe-rtl" : "nav-swipe";
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.append(style);
      }
      // The leaving screen is captured where the finger left it (its drag
      // transform), so it only covers the rest of the way; the arriving
      // one starts right beside it. Groups don't move on their own.
      style.textContent = `
        @keyframes nav-swipe-out {
          to { translate: ${sign * 100}% 0; transform: translateX(${-x}px); }
        }
        @keyframes nav-swipe-in {
          from { translate: ${-sign * 100}% 0; transform: translateX(${x}px); }
          to { translate: 0 0; transform: none; }
        }
        ::view-transition-group(.${cls}) { animation: none; }
        ::view-transition-old(.${cls}) {
          animation: ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1) both nav-swipe-out;
        }
        ::view-transition-new(.${cls}) {
          animation: ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1) both nav-swipe-in;
        }`;
      link.click();
      // Normally this screen is gone by then; if not, don't leave it adrift.
      setTimeout(() => {
        if (screen.isConnected) reset();
      }, 1000);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onCancel);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
    };
  }, [linkRef, dir]);
}
