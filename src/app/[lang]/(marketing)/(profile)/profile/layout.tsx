import { getAuth } from "@/lib/auth";
import { LocaleProps } from "@/types/locale";

import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/nav-link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";

type ProfileLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function ProfileLayout({ children, params }: ProfileLayoutProps) {
	const { lang } = await params;
	const { user } = await getAuth();
	const navs = [
		{ segments: null, value: "/profile", label: "Profile" },
		{ segments: ["orders"], value: "/profile/orders", label: "Orders" },
		{ segments: ["settings"], value: "/profile/settings", label: "Settings", disabled: true },
	];
	if (!user?.["id"]) redirect(`/${lang}/login`);

	return (
		<div className="flex flex-1 flex-col">
			{/* Header */}
			<header className="container">
				<div className="flex items-start gap-2 pb-6 pt-10">
					<Avatar user={user} />
					<div>
						<p>{user?.["name"]}</p>
						<p>{user?.["email"]}</p>
					</div>
				</div>

				<div className="flex items-center gap-6 rounded-md bg-muted">
					{navs?.["length"] ? (
						<nav>
							<ul className="flex items-center justify-start gap-2 text-sm">
								{navs?.map((item, i) => (
									<li key={i}>
										<NavLink
											href={item?.["value"]}
											disabled={item?.["disabled"]}
											segments={item?.["segments"]}
											className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground")}
											// className={cn(buttonVariants({ variant: "link" }))}
											activeClassNames="border-foreground text-primary underline underline-offset-[12px]"
										>
											{item?.["label"]}
										</NavLink>
									</li>
								))}
							</ul>
						</nav>
					) : null}
				</div>
			</header>

			<main className="flex-1">{children}</main>
		</div>
	);
}
