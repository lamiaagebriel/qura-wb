"use client";

import { useSyncExternalStore } from "react";
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
  useSyncExternalStore(subscribe, () => true, () => false);

export function ModeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const mounted = useMounted();

  return (
    <ToggleGroup
      aria-label={t("Theme")}
      value={mounted && theme ? [theme] : []}
      onValueChange={([next]) => next && setTheme(next)}
    >
      {MODES.map(({ value, label, icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={t(label)}>
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
