import type { Metadata } from "next";
import { LocaleProps } from "@/types/locale";

type DashboardProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({ params }: DashboardProps) {
	const { locale } = await params;

	return <div className="container">Dashboard</div>;
}
