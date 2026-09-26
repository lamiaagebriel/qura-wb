import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/provider";
import { getTranslations } from "@/lib/i18n/server";

// One font for every locale: Cairo covers both Latin and Arabic.
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t("Qura — Your city, one feed"),
    description: t(
      "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
    ),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dir, messages } = await getTranslations();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale} messages={messages}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
