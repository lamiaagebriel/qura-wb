import { getAuth } from "@/lib/auth";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Icons } from "@/components/icons";
import {
	BadgeCheck,
	Bell,
	BookOpen,
	Bot,
	ChevronRight,
	ChevronsUpDown,
	Command,
	CreditCard,
	Folder,
	Frame,
	LifeBuoy,
	LogOut,
	Map,
	MoreHorizontal,
	PieChart,
	Send,
	Settings2,
	SquareTerminal,
	Store,
} from "lucide-react";

type DashboardLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
	const { lang } = await params;
	const { user } = await getAuth();
	if (!user) redirect(`/${lang}/login`);

	return (
		<Sidebar
			items={{
				content: [
					{
						label: "Overview",
						items: [
							{
								label: "Dashboard",
								value: "/dashboard",
								icon: <Icons.dashboard />,
							},
							{
								label: "Orders",
								value: "/dashboard/orders",
								icon: <Icons.shoppingBag />,
							},
						],
					},
					{
						label: "Work",
						items: [
							{
								label: "Stores",
								value: "/dashboard/stores",
								icon: <Icons.store />,
							},
						],
					},
				],
				footer: [
					{
						items: [
							{
								label: "Settings",
								value: "/dashboard/settings",
								icon: <Icons.settings />,
							},
							{
								label: "Support",
								value: "/dashboard/settings",
								icon: <Icons.lifeBuoy />,
							},
							{
								label: "Feedback",
								value: "/dashboard/settings",
								icon: <Icons.send />,
							},
						],
					},
				],
			}}
		>
			{children}
		</Sidebar>
	);
}
