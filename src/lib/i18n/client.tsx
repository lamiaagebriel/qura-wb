"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";

import { setLang } from "./actions";
import { Dict, dict, LOCALE_META, type Locale } from "./config";
import { DirectionProvider } from "@/components/ui/direction";

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
