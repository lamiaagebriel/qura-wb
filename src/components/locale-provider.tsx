"use client";

import * as React from "react";

import { localeSwitcher } from "@/servers/locale";
import { Dictionary, Locale } from "@/lib/locale";
import { handleServerAction } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

type LocaleContextProps = Readonly<Dictionary & { locale: Locale }>;
const LocaleContext = React.createContext<LocaleContextProps | null>(null);

type LocaleProviderProps = Readonly<
  React.PropsWithChildren<{ value: LocaleContextProps }>
>;
export function LocaleProvider({ value, ...props }: LocaleProviderProps) {
  return <LocaleContext.Provider value={value} {...props} />;
}

export function useLocale() {
  const context = React.useContext(LocaleContext);
  if (!context)
    throw new Error("useLocale must be used within a LocaleProvider");

  return context;
}

export function LocaleSwitcher({}) {
  const { locale } = useLocale();
  const [loading, setLoading] = React.useState(false);
  return (
    <Button
      onClick={async (e) => {
        setLoading(true);
        await handleServerAction(
          localeSwitcher({ locale: locale === "ar" ? "en" : "ar" })
        ).finally(() => {
          setLoading(false);
        });
      }}
      disabled={loading}
    >
      {loading && <Icons.spinner />}
      {locale}
    </Button>
  );
}
