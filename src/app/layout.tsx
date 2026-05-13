import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";
import React from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return {
    title: t("Qura — Your city, one feed"),
    description: t(
      "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Sousse and Hammamet.",
    ),
  };
}

type RootLayoutProps = React.PropsWithChildren<{}>;
export default async function RootLayout({ children }: RootLayoutProps) {
  const { locale, dir } = await getLocale();

  return (
    <html
      lang={locale}
      dir={dir}
      className={cn("h-full font-sans antialiased", inter.variable)}
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
