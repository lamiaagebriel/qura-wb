import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";

import "@/styles/globals.css";

import { SessionProvider } from "@/components/session-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionaries";
import { i18n } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { LocaleProps } from "@/types/locale";

const cairo = Cairo({ subsets: ["arabic"] });
const inter = Inter({ subsets: ["latin"] });

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
  params: LocaleProps;
}>;

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}
export async function generateMetadata({
  params: { lang },
}: Readonly<{
  params: LocaleProps;
}>): Promise<Metadata> {
  const { site: c } = await getDictionary(lang);

  return {
    title: { template: `%s | ${c?.["name"]}`, default: `${c?.["name"]}` },
    description: c?.["description"],
  };
}
export default async function RootLayout({
  children,
  params: { lang },
}: RootLayoutProps) {
  const session = await getAuth();

  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={cn(
        // "leading-relaxed tracking-tight",
        lang === "ar" ? cairo?.["className"] : inter?.["className"]
      )}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <SessionProvider value={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider delayDuration={0} disableHoverableContent={true}>
              {/* eslint-disable-next-line react/no-unknown-property */}
              <div
                vaul-drawer-wrapper=""
                className="flex min-h-screen flex-col bg-background"
              >
                {children}
              </div>

              <Toaster />
              <TailwindIndicator />
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
