"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { HugeiconsIcon, Loading03Icon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const INTENT = 10; // px moved before deciding: pull or not
const MAX = 140; // the pull approaches this, with growing resistance
const THRESHOLD = 64; // pulled this far, letting go refreshes
const HOLD = 52; // content rests this far down while refreshing
const MIN_SPIN = 600; // ms: a refresh never flashes by
const ICON = 28; // px

/** Finger distance → pull distance: 1:1 at first, then ever stiffer. */
const rubber = (dy: number) => (MAX * dy) / (dy + MAX);

/**
 * Pull down from the top of the screen to refresh (iOS/Android style).
 * Wrap a screen's content under its `<AppHeader>`. By default it re-renders
 * the screen's server data (`router.refresh()`); pass `onRefresh` to reload
 * client data instead. Touch only — desktop has the browser's reload.
 */
export function PullToRefresh({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLSpanElement>(null);
  const startedAt = useRef(0);

  /** Moves the content down by `px` (and the indicator with it). */
  const setPull = (px: number, animate = false) => {
    const content = contentRef.current;
    const indicator = indicatorRef.current;
    if (!content || !indicator) return;
    const transition = animate ? "transform 300ms var(--nav-ease), opacity 300ms" : "none";
    content.style.transition = transition;
    // No transform at rest: it would trap position:fixed descendants.
    content.style.transform = px ? `translateY(${px}px)` : "";
    indicator.style.transition = transition;
    indicator.style.transform = `translateY(${Math.max(0, (px - ICON) / 2)}px)`;
    indicator.style.opacity = String(Math.min(1, px / THRESHOLD));
    if (dialRef.current) dialRef.current.style.transform = `rotate(${px * 4}deg)`;
  };

  // Called from the touch listeners (attached once) with the latest props.
  const isRefreshing = useEffectEvent(() => refreshing);
  const refresh = useEffectEvent(() => {
    startedAt.current = performance.now();
    setRefreshing(true);
    setPull(HOLD, true);
    startTransition(async () => {
      if (onRefresh) await onRefresh();
      else router.refresh();
    });
  });

  // Refresh finished (and shown for at least MIN_SPIN) → slide back up.
  useEffect(() => {
    if (!refreshing || pending) return;
    const wait = Math.max(0, MIN_SPIN - (performance.now() - startedAt.current));
    const timer = setTimeout(() => {
      setRefreshing(false);
      setPull(0, true);
    }, wait);
    return () => clearTimeout(timer);
  }, [refreshing, pending]);

  useEffect(() => {
    const root = rootRef.current;
    const screen = root?.closest("[data-screen]") ?? root;
    if (!root || !screen) return;

    let start: { x: number; y: number } | null = null;
    let pulling = false;
    let armed = false;
    let pull = 0;

    const onStart = (event: TouchEvent) => {
      start = null;
      if (event.touches.length !== 1 || isRefreshing()) return;
      if (window.scrollY > 0 || document.documentElement.dataset.keyboard) return;
      const target = event.target;
      // Only this screen (not a sheet), and not inside a scrolled inner list.
      if (!(target instanceof Element) || !screen.contains(target)) return;
      for (let el: Element | null = target; el && el !== screen; el = el.parentElement) {
        if (el.scrollTop > 0) return;
      }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
      pulling = armed = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!start) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!pulling) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < INTENT) return;
        if (dy <= Math.abs(dx) || window.scrollY > 0) {
          start = null; // a scroll or a sideways swipe
          return;
        }
        pulling = true;
        start = { x: touch.clientX, y: touch.clientY }; // no jump past INTENT
      }
      event.preventDefault();
      pull = rubber(Math.max(0, touch.clientY - start.y));
      setPull(pull);
      if (!armed && pull >= THRESHOLD) navigator.vibrate?.(8); // Android only
      armed = pull >= THRESHOLD;
    };

    const onEnd = () => {
      if (!start) return;
      start = null;
      if (!pulling) return;
      pulling = false;
      if (armed) refresh();
      else setPull(0, true);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative flex flex-1 flex-col">
      <div
        ref={indicatorRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center opacity-0"
      >
        <span ref={dialRef} className="flex">
          <HugeiconsIcon
            icon={Loading03Icon}
            strokeWidth={2}
            className={cn(
              "size-7 text-muted-foreground",
              refreshing && "animate-spin motion-reduce:animate-none",
            )}
          />
        </span>
      </div>
      <p role="status" className="sr-only">
        {refreshing ? t("Refreshing…") : ""}
      </p>
      <div ref={contentRef} data-pull-content className="flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
