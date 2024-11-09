import { UserAccountNav } from "@/components/_users/account-nav";
import { getDictionary } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";
import type { Metadata } from "next";

type DashboardProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({ params }: DashboardProps) {
	const { locale } = await params;
	const dic = await getDictionary({ locale });
	return (
		<>
			Dashboard
			<UserAccountNav dic={dic} items={[]} />
		</>
	);
}
