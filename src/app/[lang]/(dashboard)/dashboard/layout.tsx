import { getAuth } from "@/lib/auth";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";

type DashboardLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
	const { lang } = await params;
	const { user } = await getAuth();
	if (!user) redirect(`/${lang}/login`);

	return <div className="flex min-h-screen flex-col">{children}</div>;
}
