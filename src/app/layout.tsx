import "./globals.css";

import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/components/locale-provider";
import { ReduxProvider } from "@/components/redux-provider";
import { SessionProvider } from "@/components/session-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin", "latin-ext"] });
const cairo = Cairo({ subsets: ["arabic", "latin", "latin-ext"] });

export async function generateMetadata(): Promise<Metadata> {
  const { site: c } = await getDictionary();

  return {
    title: { template: `%s | ${c?.name}`, default: `${c?.name}` },
    description: c?.description,
  };
}
// export const revalidate = 86400; // One day

type RootLayoutProps = Readonly<React.PropsWithChildren<{}>>;
export default async function RootLayout({ children }: RootLayoutProps) {
  const { locale, ...dic } = await getDictionary();
  const session = await getAuth();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={cn("", locale === "ar" ? cairo?.className : inter?.className)}
    >
      <body>
        <LocaleProvider value={{ ...dic, locale }}>
          <SessionProvider value={session}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TooltipProvider delayDuration={0} disableHoverableContent={true}>
                <ReduxProvider>
                  {/* eslint-disable-next-line react/no-unknown-property */}
                  {/* <div vaul-drawer-wrapper="" className="flex min-h-screen flex-col bg-background"> */}
                  {children}
                  {/* </div> */}

                  <Toaster />
                  <TailwindIndicator />
                </ReduxProvider>
              </TooltipProvider>
            </ThemeProvider>
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
