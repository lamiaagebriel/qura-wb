import "./globals.css";

import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";

import { getDictionary } from "@/servers/locale";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/components/locale-provider";
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

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={cn("", cairo?.className)}
      suppressHydrationWarning
    >
      <body>
        <LocaleProvider value={{ ...dic, locale }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <TailwindIndicator />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
