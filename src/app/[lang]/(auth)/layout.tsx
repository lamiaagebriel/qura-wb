import { getAuth } from "@/lib/auth";
import { LocaleProps } from "@/types/locale";
import { redirect } from "next/navigation";

type AuthLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function AuthLayout({ children, params }: AuthLayoutProps) {
	const { lang } = await params;
	const { user } = await getAuth();
	if (user) redirect(`/${lang}/dashboard`);

	return <div className="flex min-h-screen flex-col">{children}</div>;
}
