"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { AuthSheetProvider } from "@/components/auth/auth-sheet";
import { InstallPromptProvider } from "@/components/install-prompt";
import { KeyboardObserver } from "@/components/keyboard";
import { HistoryTracker } from "@/components/navigation/history";
import { OfflineBanner } from "@/components/offline/offline-banner";
import { ServiceWorker } from "@/components/offline/service-worker";
import { PlacesProvider } from "@/components/places/places-provider";
import { ThemeColor } from "@/components/theme-color";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Locale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/types";
import type { Place } from "@/lib/places";

/**
 * Every app-wide provider, in one place. `ThemeProvider` toggles the `.dark`
 * class (light / dark / system). `LocaleProvider` also sets the
 * reading direction for all shadcn/Base UI components. `Toaster` makes
 * `toast.add(...)` (from `@/components/ui/toast`) work anywhere, and
 * `AuthSheetProvider` lets any component open the sign-in sheet, and
 * `PlacesProvider` gives every screen the places (`usePlaces()`).
 */
export function Providers({
  locale,
  messages,
  places,
  children,
}: {
  locale: Locale;
  messages: Partial<Messages>;
  places: Place[];
  children: ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      // The theme script only needs to run from the server HTML (before paint).
      // Marking it non-executable on the client silences React 19's
      // "script tag while rendering" warning; next-themes already suppresses
      // the hydration mismatch on this tag.
      scriptProps={{
        type: typeof window === "undefined" ? undefined : "application/json",
      }}
    >
      <LocaleProvider locale={locale} messages={messages}>
        <TooltipProvider>
          <Toaster>
            <InstallPromptProvider>
              <PlacesProvider places={places}>
                <AuthSheetProvider>{children}</AuthSheetProvider>
              </PlacesProvider>
            </InstallPromptProvider>
            <HistoryTracker />
            <ThemeColor />
            <ServiceWorker />
            <OfflineBanner />
            <KeyboardObserver />
          </Toaster>
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
