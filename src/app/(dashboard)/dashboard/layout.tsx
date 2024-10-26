import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

type DashboardLayoutProps = Readonly<{
	children: React.ReactNode;
}>;

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
	const { user } = await getAuth();
	if (!user) redirect(`/login`);

	return <div className="flex min-h-screen flex-col">{children}</div>;
}
