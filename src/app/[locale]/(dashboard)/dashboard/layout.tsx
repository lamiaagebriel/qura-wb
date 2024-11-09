import { getAuth } from "@/lib/lucia";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";

type DashboardLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
	const { locale } = await params;
	const { user } = await getAuth();
	if (!user) redirect(`/${locale}/login`);

	return <>{children}</>;
}
