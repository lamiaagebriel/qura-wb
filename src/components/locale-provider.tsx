"use client";

import * as React from "react";

import { Dictionary, Locale } from "@/lib/locale";

type LocaleContext = Dictionary & { locale: Locale };
const LocaleContext = React.createContext<LocaleContext | null>(null);

type LocaleProviderProps = React.PropsWithChildren<{ value: LocaleContext }>;
export function LocaleProvider({ value, ...props }: LocaleProviderProps) {
  return <LocaleContext.Provider value={value} {...props} />;
}

export function useLocale() {
  const context = React.useContext(LocaleContext);
  if (!context)
    throw new Error("useLocale must be used within a LocaleProvider");

  return context;
}
