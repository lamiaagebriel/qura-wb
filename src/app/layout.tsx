import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/mode-switcher";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return {
    title: t("Qura — Your city, one feed"),
    description: t(
      "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Sousse and Hammamet.",
    ),
    manifest: "/manifest.json",
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

type RootLayoutProps = React.PropsWithChildren;
export default async function RootLayout({ children }: RootLayoutProps) {
  const { locale, dir } = await getLocale();

  return (
    <html
      lang={locale}
      dir={dir}
      className={cn("h-full font-sans antialiased", inter.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider locale={locale}>
          <ThemeProvider>
            {children}

            <Toaster />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
