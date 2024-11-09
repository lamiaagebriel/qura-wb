import "@/styles/globals.css";
import type { Metadata } from "next";

import { getDictionary, i18n } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";
import { cn } from "@/lib/shadcn";

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

	return (
		<html
			lang={locale}
			dir={locale === "ar" ? "rtl" : "ltr"}
			className={cn("leading-relaxed tracking-tight")}
		>
			<body>{children}</body>
		</html>
	);
}
