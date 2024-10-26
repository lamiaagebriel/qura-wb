import { LogoutButton } from "@/components/logout";
import { getAuth } from "@/lib/auth";
import type { Metadata } from "next";

type DashboardProps = Readonly<{}>;
export const metadata: Metadata = { title: "Dashboard" };
export default async function Dashboard({}: DashboardProps) {
	const user = (await getAuth())?.["user"]!;

	console.log(user);
	return (
		<div className="container">
			Dashboard
			<LogoutButton />
		</div>
	);
}
