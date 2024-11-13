import "@/styles/globals.css";

import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";

import { getDictionary, i18n } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";
import { cn } from "@/lib/shadcn";
import { getAuth } from "@/lib/lucia";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";

const inter = Inter({ subsets: ["latin", "latin-ext"] });
const cairo = Cairo({ subsets: ["arabic", "latin", "latin-ext"] });

type RootLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export async function generateStaticParams() {
	return i18n.locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
	params,
}: Pick<RootLayoutProps, "params">): Promise<Metadata> {
	const { locale } = await params;
	const { site: c } = await getDictionary({ locale });

	return {
		title: { template: `%s | ${c?.["name"]}`, default: `${c?.["name"]}` },
		description: c?.["description"],
	};
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
	const { locale } = await params;
	const session = await getAuth();

	return (
		<html
			lang={locale}
			dir={locale === "ar" ? "rtl" : "ltr"}
			className={cn(
				"tracking-tight",
				locale === "ar" ? cairo?.["className"] : inter?.["className"],
			)}
		>
			<body>
				<SessionProvider value={session}>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						<TooltipProvider delayDuration={0} disableHoverableContent={true}>
							{children}

							<Toaster />
							<TailwindIndicator />
						</TooltipProvider>
					</ThemeProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
