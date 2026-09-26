"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Locale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/types";

/**
 * Every app-wide provider, in one place. `ThemeProvider` toggles the `.dark`
 * class (light / dark / system). `LocaleProvider` also sets the
 * reading direction for all shadcn/Base UI components. `Toaster` makes
 * `toast.add(...)` (from `@/components/ui/toast`) work anywhere.
 */
export function Providers({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Partial<Messages>;
  children: ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LocaleProvider locale={locale} messages={messages}>
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
