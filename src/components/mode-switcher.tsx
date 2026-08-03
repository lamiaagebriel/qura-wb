"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { useLocale } from "@/lib/i18n/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODES = ["light", "dark", "system"] as const;

import * as React from "react";

export function ThemeProvider({
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    />
  );
}
const MODE_ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const MODE_LABEL = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

export function ModeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const active = (theme ?? "system") as (typeof MODES)[number];
  const Icon = MODE_ICON[active];

  return (
    <Select
      value={active}
      onValueChange={(val: (typeof MODES)[number]) => setTheme(val)}
    >
      <SelectTrigger aria-label={t("Select theme")}>
        <SelectValue placeholder={t("Theme")}>
          <span className="flex items-center gap-1.5">
            <Icon className="size-4" />
            {t(MODE_LABEL[active])}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {MODES.map((m) => {
            const ModeIcon = MODE_ICON[m];
            return (
              <SelectItem
                key={m}
                value={m}
                className={m === active ? "text-primary font-semibold" : ""}
                aria-selected={m === active}
              >
                <span className="flex items-center gap-1.5">
                  <ModeIcon className="size-4" />
                  {t(MODE_LABEL[m])}
                </span>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
