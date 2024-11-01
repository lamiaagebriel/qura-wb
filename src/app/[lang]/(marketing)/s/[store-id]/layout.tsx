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
import { db } from "@/lib/db";

type StoreLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<{ "store-id": string } & LocaleProps>;
}>;

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
	const { lang, "store-id": storeId } = await params;
	const store = await db.store.findUnique({ where: { id: storeId } });
	if (!store) return <>NO STORE</>;

	return (
		<div className="flex min-h-screen flex-col">
			<div className="container flex flex-col items-center justify-between gap-2 py-2 sm:flex-row">
				<h1>{store?.["name"]}</h1>
			</div>

			<main className="flex-1">{children}</main>
		</div>
	);
}
