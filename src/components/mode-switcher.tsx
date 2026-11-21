"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import {
  ComputerIcon,
  HugeiconsIcon,
  Moon02Icon,
  Sun03Icon,
} from "@/components/icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale } from "@/lib/i18n/provider";

const MODES = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "System", icon: ComputerIcon },
] as const;

// The saved theme is only known in the browser; render nothing selected on
// the server to avoid a hydration mismatch.
const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export function ModeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const mounted = useMounted();

  // The new theme spreads as a circle from the button you pressed until it
  // covers the screen (animate-ui's theme toggler, ripple style); a plain
  // switch without view transitions or with reduced motion.
  const change = (next: string, button: Element | null) => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce || !button)
      return setTheme(next);

    const { left, top, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    // Far enough to reach the farthest corner.
    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    document
      .startViewTransition(() => flushSync(() => setTheme(next)))
      .ready.then(() =>
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        ),
      )
      .catch(() => {});
  };

  return (
    <ToggleGroup
      aria-label={t("Theme")}
      value={mounted && theme ? [theme] : []}
      // The pressed button: the one the tap or key event came from.
      onValueChange={([next], { event }) =>
        next &&
        change(
          next,
          event.target instanceof Element
            ? event.target.closest("button")
            : document.activeElement,
        )
      }
    >
      {MODES.map(({ value, label, icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={t(label)}
          // 44px touch target.
          className="size-11"
        >
          <HugeiconsIcon icon={icon} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
