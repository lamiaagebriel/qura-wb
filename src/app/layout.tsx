import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

// One font for every locale: Cairo covers both Latin and Arabic.
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
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
      // next-themes sets the theme class before hydration.
      suppressHydrationWarning
      className={cn("h-full font-sans antialiased", cairo.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
