import { getAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/locale";
import { LocaleProps } from "@/types/locale";

import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggler } from "@/components/mode-toggler";
import { SiteNav } from "@/components/site-nav";
import { PoundSterling, Search } from "lucide-react";
import { UserAccountNav } from "@/components/_users/account-nav";

type MarketingLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<LocaleProps>;
}>;

export default async function MarketingLayout({ children, params }: MarketingLayoutProps) {
	const { lang } = await params;
	const {
		marketing: { "main-nav": mainNav, layout: c },
		...dic
	} = await getDictionary(lang);
	const { user } = await getAuth();

	return (
		<div className="flex min-h-screen flex-col">
			<div className="container flex flex-col items-center justify-between gap-2 py-2 sm:flex-row">
				<div className="flex items-center gap-2">
					<ModeToggler dic={dic} />
					<LocaleSwitcher dic={dic} />

					<Button variant="ghost" size="icon" className="rounded-full">
						<Icons.search />
					</Button>
				</div>
			</div>

			<SiteNav dic={dic} items={mainNav}>
				<>
					{user ? (
						<UserAccountNav dic={dic} items={[]} />
					) : (
						<>
							<Link
								href="/login"
								className={buttonVariants({
									variant: "link",
									className: "gap-2 px-4",
								})}
							>
								{c?.["login"]}
								<Avatar user={null} className="h-5 w-5 border" />
							</Link>
						</>
					)}
				</>
			</SiteNav>
			<main className="flex-1">{children}</main>
		</div>
	);
}
