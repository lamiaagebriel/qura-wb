"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { BackButton } from "@/components/navigation/back-button";
import { cn } from "@/lib/utils";

/**
 * App-style top bar (sticky, under the status bar):
 * - `back`: shows a back arrow; the value is the parent screen used when
 *   there's no in-app history (deep link).
 * - `action`: at most one icon button at the end.
 * - `large`: iOS large title under the bar that collapses into it on scroll.
 * - `children`: content under the title, e.g. a search field.
 * Like iOS: transparent at the top; the blur background + hairline appear
 * once scrolled (with `large`, once the big title has tucked under the bar,
 * when the small title fades in inline with the icons).
 */
export function AppHeader({
  title,
  back,
  action,
  large = false,
  children,
}: {
  title: string;
  back?: string;
  action?: ReactNode;
  large?: boolean;
  children?: ReactNode;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const largeTitleRef = useRef<HTMLHeadingElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(!large);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Page scrolled at all → show the bar's background and border.
    if (topRef.current) {
      const o = new IntersectionObserver(([e]) =>
        setScrolled(!e.isIntersecting),
      );
      o.observe(topRef.current);
      observers.push(o);
    }
    // Large title hidden under the bar → show the small title in the bar.
    if (large && largeTitleRef.current && barRef.current) {
      const o = new IntersectionObserver(
        ([e]) => setCollapsed(!e.isIntersecting),
        { rootMargin: `-${barRef.current.offsetHeight}px 0px 0px 0px` },
      );
      o.observe(largeTitleRef.current);
      observers.push(o);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [large]);

  return (
    <>
      <div ref={topRef} aria-hidden className="-mb-px h-px" />
      <header
        ref={barRef}
        // iOS: with a large title the bar stays clear until the title has
        // scrolled under it; other screens get the bar as soon as they scroll.
        data-scrolled={large ? collapsed : scrolled}
        className="sticky top-0 z-30 border-b border-transparent pt-(--safe-top) transition-[background-color,border-color,backdrop-filter] duration-200 data-[scrolled=true]:border-border/60 data-[scrolled=true]:bg-background/80 data-[scrolled=true]:backdrop-blur-xl"
      >
        <div className="mx-auto grid h-11 max-w-md grid-cols-[1fr_auto_1fr] items-center px-1.5">
          <div className="flex justify-start">
            {back && <BackButton fallback={back} />}
          </div>
          <p
            aria-hidden={large}
            className={cn(
              // Small inline title: fades and rises into the bar (iOS).
              "truncate px-2 text-center text-base font-semibold transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none",
              collapsed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            )}
          >
            {title}
          </p>
          <div className="flex justify-end">{action}</div>
        </div>
      </header>

      {large ? (
        <div className="mx-auto w-full max-w-md px-4 pt-1 pb-2">
          {/* iOS large title: its own row under the icons, start-aligned. */}
          <h1
            ref={largeTitleRef}
            className="font-heading text-[2.125rem] leading-tight font-bold tracking-tight"
          >
            {title}
          </h1>
        </div>
      ) : (
        <h1 className="sr-only">{title}</h1>
      )}
      {children && (
        <div className="mx-auto w-full max-w-md px-4 pb-3">{children}</div>
      )}
    </>
  );
}
