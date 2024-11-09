import { getAuth } from "@/lib/lucia";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";

type AuthLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
	const { locale } = await params;
	const { user } = await getAuth();
	if (user) redirect(`/${locale}/dashboard`);

	return <div className="flex min-h-screen flex-col">{children}</div>;
}
