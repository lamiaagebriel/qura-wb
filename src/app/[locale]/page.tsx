import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";

type HomeProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Home" };
export default async function Home({ params }: HomeProps) {
	const { locale } = await params;

	return <div>Home {locale}</div>;
}
