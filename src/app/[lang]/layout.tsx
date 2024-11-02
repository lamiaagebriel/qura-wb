import "@/styles/globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";

import { cn } from "@/lib/utils";
import { getDictionary, i18n } from "@/lib/locale";
import { getAuth } from "@/lib/auth";
import { LocaleProps } from "@/types/locale";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReduxProvider } from "@/components/redux-provider";

const cairo = localFont({
	src: "../../../public/fonts/cairo.ttf",
	variable: "--font-cairo",
	weight: "100 900",
});

type RootLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export async function generateStaticParams() {
	return i18n.locales.map((locale) => ({ lang: locale }));
}
export async function generateMetadata({
	params,
}: Pick<RootLayoutProps, "params">): Promise<Metadata> {
	const { lang } = await params;
	const { site: c } = await getDictionary(lang);

	return {
		title: { template: `%s | ${c?.["name"]}`, default: `${c?.["name"]}` },
		description: c?.["description"],
	};
}
export default async function RootLayout({ children, params }: RootLayoutProps) {
	const { lang } = await params;
	const session = await getAuth();

	return (
		<html
			lang={lang}
			dir={lang === "ar" ? "rtl" : "ltr"}
			className={cn("leading-relaxed tracking-tight", cairo?.["className"])}
			suppressHydrationWarning
		>
			<body suppressHydrationWarning>
				<SessionProvider value={session}>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						<TooltipProvider delayDuration={0} disableHoverableContent={true}>
							<ReduxProvider>
								{/* eslint-disable-next-line react/no-unknown-property */}
								<div vaul-drawer-wrapper="" className="flex min-h-screen flex-col bg-background">
									{children}
								</div>

								<Toaster />
								<TailwindIndicator />
							</ReduxProvider>
						</TooltipProvider>
					</ThemeProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
