import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";
import { getDictionary } from "@/lib/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({ params }: DashboardProps) {
	const { locale } = await params;
	const dic = await getDictionary({ locale });

	return (
		<div className="container">
			<SidebarTrigger className="-ml-1" />
			Dashboard
		</div>
	);
}
