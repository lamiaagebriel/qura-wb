import type { Metadata, Viewport } from "next";
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t("Qura — Your city, one feed"),
    description: t(
      "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
    ),
    // Installed on iPhone ("Add to Home Screen"): open full-screen, and let the
    // app draw under the status bar so it's part of the page (and of the
    // sheet's scale-back effect) instead of a separate strip.
    appleWebApp: {
      capable: true,
      title: "Qura",
      statusBarStyle: "black-translucent",
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
