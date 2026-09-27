import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BRAND, SPLASH_SCREENS } from "@/lib/brand";
import { env } from "@/lib/env";
import { LOCALE_META, LOCALES } from "@/lib/i18n/config";
import { getTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

// One font for every locale: Cairo covers both Latin and Arabic.
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
});

/**
 * One full-screen surface on every page, in the browser and when installed:
 * draw under the notch/status bar and home indicator (`viewport-fit=cover`;
 * screens pad themselves with safe-area insets) and color the browser/system
 * bars to match the app background in light and dark.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.light.background },
    { media: "(prefers-color-scheme: dark)", color: BRAND.dark.background },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getTranslations();
  const title = t("Qura — Your city, one feed");
  const description = t(
    "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
  );

  return {
    // Makes every relative URL below (and in pages) absolute — required for
    // share cards and the sitemap to point at the real domain.
    metadataBase: new URL(env.APP_URL),
    // Pages set just their own name: `title: "Settings"` → "Settings · Qura".
    title: { default: title, template: `%s · ${BRAND.name}` },
    description,
    applicationName: BRAND.name,
    keywords: [
      "Qura",
      "Aswan",
      "local feed",
      "restaurants",
      "events",
      "jobs",
      "apartments",
      "Egypt",
    ],
    robots: { index: true, follow: true },
    // Don't turn numbers/addresses into links on iOS.
    formatDetection: { telephone: false, address: false, email: false },

    // Share cards (WhatsApp, Facebook, X, iMessage…). The image comes from
    // app/opengraph-image.tsx.
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      title,
      description,
      locale: LOCALE_META[locale].ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map(
        (l) => LOCALE_META[l].ogLocale,
      ),
    },
    twitter: { card: "summary_large_image", title, description },

    // Installed on iPhone ("Add to Home Screen"): open full-screen, and let the
    // app draw under the status bar so it's part of the page (and of the
    // sheet's scale-back effect) instead of a separate strip.
    appleWebApp: {
      capable: true,
      title: BRAND.name,
      statusBarStyle: "black-translucent",
      // Launch screen per iPhone size, light and dark (static files).
      startupImage: SPLASH_SCREENS.map(({ name, media }) => ({
        url: `/splash/${name}`,
        media,
      })),
    },
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
          {/* The page vaul scales back while a bottom sheet is open. */}
          <div data-vaul-drawer-wrapper="" className="flex min-h-(--app-height) flex-col bg-background">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
