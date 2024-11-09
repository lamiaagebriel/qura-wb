import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { getDictionary } from "@/lib/locale";
import { LocaleSwitcher } from "@/components/locale-switcher";

type HomeProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Home" };
export default async function Home({ params }: HomeProps) {
	const { locale } = await params;
	const dic = await getDictionary({ locale });

	return (
		<div>
			<LocaleSwitcher dic={dic} />
			<br />
			<br />
			{JSON.stringify(dic, null, 1)}
		</div>
	);
}
