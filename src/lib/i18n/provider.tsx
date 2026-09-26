"use client";

import { createContext, use, useTransition, type ReactNode } from "react";

import { setLocale } from "./actions";
import { LOCALE_META, type Locale } from "./config";
import { createTranslator } from "./translate";
import type { Messages, Translate } from "./types";

type LocaleContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Translate;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Receives only the active locale's messages from the root layout, so the
 * client bundle never ships the other languages. Switching locale saves the
 * cookie via a server action, and the server re-renders with the new
 * messages — no client-side dictionary swapping.
 */
export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Partial<Messages>;
  children: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  const value: LocaleContextValue = {
    locale,
    dir: LOCALE_META[locale].dir,
    t: createTranslator(messages),
    setLocale: (next) => startTransition(() => setLocale(next)),
    isPending,
  };

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

/** Client-side equivalent of `getTranslations()`. */
export function useLocale() {
  const ctx = use(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
