"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";

import { setLang } from "./actions";
import { Dict, dict, LOCALE_META, LOCALES, type Locale } from "./config";
import { DirectionProvider } from "@/components/ui/direction";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocaleContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: keyof Dict) => string;
  changeLocale: (locale: Locale) => void;
  isPending: boolean;
};

const LocaleCtx = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale: initial,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [isPending, start] = useTransition();
  const [locale, setOptimistic] = useOptimistic(initial);

  const d = dict[locale];
  const dir = LOCALE_META[locale].dir;
  const t = (key: keyof Dict) => d[key] ?? key;
  const changeLocale = (next: Locale) =>
    start(async () => {
      setOptimistic(next);
      await setLang(next);
    });

  return (
    <LocaleCtx.Provider
      value={{
        locale,
        dir,
        t,
        changeLocale,
        isPending,
      }}
    >
      <DirectionProvider dir={dir}>{children}</DirectionProvider>
    </LocaleCtx.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

/**
 * LocaleSwitcher — now uses a Select to select language.
 */
export function LocaleSwitcher() {
  const { locale, changeLocale, isPending } = useLocale();

  return (
    <Select
      value={locale}
      onValueChange={(val: Locale) => {
        if (!isPending && val !== locale) changeLocale(val);
      }}
      disabled={isPending}
    >
      <SelectTrigger aria-label="Select language">
        <SelectValue placeholder="Language">
          <span className="flex items-center gap-1.5">
            <img
              src={`https://flagcdn.com/h24/${LOCALE_META[locale].flag}.png`}
              alt={`${LOCALE_META[locale].label} flag`}
              className="mr-1 inline-block h-3 w-4 object-contain object-center align-middle"
            />

            <span>{LOCALE_META[locale].label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {LOCALES.map((l) => (
            <SelectItem
              key={l}
              value={l}
              disabled={isPending}
              className={l === locale ? "text-primary font-semibold" : ""}
              aria-selected={l === locale}
            >
              <span className="flex items-center gap-1.5">
                <img
                  src={`https://flagcdn.com/h24/${LOCALE_META[l].flag}.png`}
                  alt={`${LOCALE_META[l].label} flag`}
                  className="mr-1 inline-block h-3 w-4 object-contain object-center align-middle"
                />{" "}
                <span>{LOCALE_META[l].label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
