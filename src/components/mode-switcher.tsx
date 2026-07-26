"use client";

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

import dynamic from "next/dynamic";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

const MODES = ["light", "dark", "system"] as const;

const ThemeProviderInner = ({
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    {...props}
  />
);
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

function ModeSwitcherInner() {
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

export const ThemeProvider = dynamic(
  () => Promise.resolve(ThemeProviderInner),
  { ssr: false },
);
export const ModeSwitcher = dynamic(() => Promise.resolve(ModeSwitcherInner), {
  ssr: false,
});
