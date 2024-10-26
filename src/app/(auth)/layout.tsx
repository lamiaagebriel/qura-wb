import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

type AuthLayoutProps = Readonly<{
	children: React.ReactNode;
}>;

export default async function AuthLayout({ children }: AuthLayoutProps) {
	const { user } = await getAuth();
	if (user) redirect(`/dashboard`);

	return <div className="flex min-h-screen flex-col">{children}</div>;
}
