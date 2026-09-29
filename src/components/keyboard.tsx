"use client";

import { useEffect } from "react";

// Real on-screen keyboards cover at least this much; less is browser chrome
// (Safari's URL bar) or a hardware keyboard's shortcut bar.
const MIN_KEYBOARD = 120;
const DRAG = 10; // px a finger moves before it's a drag, not a tap

const NOT_TEXT = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Elements that bring up the on-screen keyboard when focused. */
const isTextField = (el: Element | null): el is HTMLElement =>
  (el instanceof HTMLInputElement && !NOT_TEXT.has(el.type) && !el.readOnly) ||
  (el instanceof HTMLTextAreaElement && !el.readOnly) ||
  (el instanceof HTMLElement && el.isContentEditable);

// Taps on these do their own thing; taps anywhere else dismiss the keyboard.
const INTERACTIVE =
  "a, button, input, textarea, select, label, summary, [contenteditable], [tabindex], [role=button], [role=link], [role=tab], [role=option], [role=menuitem], [role=checkbox], [role=radio], [role=switch], [data-keep-keyboard]";

/**
 * Native keyboard behavior for the whole app (mounted once in Providers):
 * - `<html data-keyboard="open">` while the on-screen keyboard is up — a
 *   text field is focused *and* the visible area actually shrank (so a
 *   hardware keyboard doesn't count). The tab bar hides on it.
 * - `--keyboard-inset`: how much of the bottom of the layout viewport the
 *   keyboard covers. Fixed bottom bars (a composer) use
 *   `bottom: var(--keyboard-inset)` to sit right on top of it.
 * - Dragging the page, or tapping empty space, dismisses the keyboard.
 *   Opt an element out with `data-keep-keyboard`.
 */
export function KeyboardObserver() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;

    const update = () => {
      frame = 0;
      const covered = viewport ? window.innerHeight - viewport.height : 0;
      const inset = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      const open = isTextField(document.activeElement) && covered > MIN_KEYBOARD;
      root.style.setProperty("--keyboard-inset", `${open ? Math.round(inset) : 0}px`);
      if (open) root.dataset.keyboard = "open";
      else delete root.dataset.keyboard;
    };
    // Batched per frame: moving between fields fires focusout + focusin,
    // which must not flash the tab bar.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    let start: { x: number; y: number } | null = null;
    let dragged = false;
    const dismiss = (target: EventTarget | null) => {
      const field = document.activeElement;
      if (!root.dataset.keyboard || !isTextField(field)) return;
      if (target instanceof Node && field.contains(target)) return;
      if (target instanceof Element && target.closest("[data-keep-keyboard]")) return;
      field.blur();
    };
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      start = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
      dragged = false;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!start || dragged) return;
      const touch = event.touches[0];
      if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) < DRAG) return;
      dragged = true;
      dismiss(event.target); // scrolling the page puts the keyboard away
    };
    const onTouchEnd = (event: TouchEvent) => {
      const tapped = start && !dragged;
      start = null;
      if (!tapped) return;
      const target = event.target;
      if (target instanceof Element && target.closest(INTERACTIVE)) return;
      dismiss(target);
    };

    update();
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      delete root.dataset.keyboard;
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return null;
}
